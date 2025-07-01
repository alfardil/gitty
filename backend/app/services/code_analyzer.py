from typing import Optional, AsyncGenerator
from app.services.o4_mini_service import OpenAIo4Service
from app.prompts import ANALYSIS_PROMPT


class CodeAnalyzer:
    def __init__(self):
        self.o4_service = OpenAIo4Service()
        self.analysis_prompt = ANALYSIS_PROMPT

    async def analyze_function_stream(
        self, function_name: str, file_content: Optional[str]
    ) -> AsyncGenerator[str, None]:
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
                data={"function_name": function_name, "file_content": file_content},
            ):
                yield chunk
        except Exception as e:
            yield f"Error analyzing function: {str(e)}"
