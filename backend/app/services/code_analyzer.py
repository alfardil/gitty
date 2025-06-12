from typing import Optional, AsyncGenerator
from app.services.o4_mini_service import OpenAIo4Service

class CodeAnalyzer:
    def __init__(self):
        self.o4_service = OpenAIo4Service()
        self.function_extraction_prompt = """
        You are an expert at understanding code-related questions. Your task is to extract the function name that the user is asking about.
        Return ONLY the function name, nothing else. If you cannot determine the function name, return "UNKNOWN_FUNCTION".

        The input will be provided in XML format like this:
        <user_question>
        What does the fetchFile function do?
        </user_question>

        Example inputs and outputs:
        Input: <user_question>What does the fetchFile function do?</user_question>
        Output: fetchFile

        Input: <user_question>Can you explain how the analyze_function works?</user_question>
        Output: analyze_function

        Input: <user_question>Tell me about the implementation of getFileContent</user_question>
        Output: getFileContent

        Remember to return ONLY the function name, nothing else.
        """

        self.analysis_prompt = """
        You are an expert code analyzer. Your task is to analyze a function in the provided code.
        You should identify:
        1. Where the function is defined
        2. What parameters it takes
        3. How it is implemented
        4. Any important details about its usage or behavior

        Format your response in a clear, structured way. If you cannot find the function or if the file content is empty,
        explain why and what might be wrong.
        """

    async def extract_function_name(self, question: str) -> str:
        """
        Extract the function name from the user's question using o4 mini.
        """
        try:
            
            data = {"user_question": question}
            
            function_name = self.o4_service.call_o4_api(
                system_prompt=self.function_extraction_prompt,
                data=data
            ).strip()
            
            if function_name == "UNKNOWN_FUNCTION":
                raise ValueError("Could not determine the function name from the question")
                
            return function_name
        except Exception as e:
            raise ValueError(f"Error extracting function name: {str(e)}")

    async def analyze_function(self, function_name: str, file_content: Optional[str]) -> dict:
        """
        Analyze a function using o4 mini.
        
        Args:
            function_name: The name of the function to analyze
            file_content: The content of the file to analyze, or None if file not found
        """
        if file_content is None:
            return {
                "function_name": function_name,
                "error": "File content not found"
            }

        try:
            analysis = self.o4_service.call_o4_api(
                system_prompt=self.analysis_prompt,
                data={
                    "function_name": function_name,
                    "file_content": file_content
                }
            )

            return {
                "function_name": function_name,
                "analysis": analysis
            }
        except Exception as e:
            return {
                "function_name": function_name,
                "error": f"Error analyzing function: {str(e)}"
            }

    async def analyze_function_stream(self, function_name: str, file_content: Optional[str]) -> AsyncGenerator[str, None]:
        """
        Stream the analysis of a function using o4 mini.
        
        Args:
            function_name: The name of the function to analyze
            file_content: The content of the file to analyze, or None if file not found
        """
        if file_content is None:
            yield "Error: File content not found"
            return

        try:
            async for chunk in self.o4_service.call_o4_api_stream(
                system_prompt=self.analysis_prompt,
                data={
                    "function_name": function_name,
                    "file_content": file_content
                }
            ):
                yield chunk
        except Exception as e:
            yield f"Error analyzing function: {str(e)}" 