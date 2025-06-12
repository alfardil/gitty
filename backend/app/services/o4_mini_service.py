import os
import tiktoken
import aiohttp
import json
from openai import OpenAI
from app.utils.format_user_message import format_user_message
from typing import AsyncGenerator


class OpenAIo4Service:
    def __init__(self):
        self.default_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        self.model = "o4-mini-2025-04-16"
        self.encoding = tiktoken.get_encoding("o200k_base")
        self.api_key = os.getenv("OPENAI_API_KEY")
        self.base_url = "https://api.openai.com/v1/chat/completions"
        self.reasoning_effort = "low"

    def call_o4_api(
            self,
            system_prompt: str,
            data: dict,
    ) -> str:
        """
        Makes an API call to OpenAI o4-mini and returns the response.

        Args:
            system_prompt (str): The instruction/system prompt
            data (dict): Dictionary of variables to format into the user message

        Returns:
            str: o4-mini's response text
        """

        user_message = format_user_message(data)

        client = self.default_client

        try:
            completion = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_message},
                ],
                max_completion_tokens=12000,
                reasoning_effort=self.reasoning_effort
            )

            if completion.choices[0].message.content is None:
                raise ValueError("No content returned from OpenAI o4-mini")

            return completion.choices[0].message.content




        except Exception as e:
            print(f"Error in o4-mini API call {str(e)}")
            raise
        
    async def call_o4_api_stream(
        self,
        system_prompt: str,
        data: dict,
    ) -> AsyncGenerator[str, None]:
        
        user_message = format_user_message(data)
        api_key = self.api_key

        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        }

        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message},
            ],
            "max_completion_tokens": 12000,
            "stream": True,
            "reasoning_effort": self.reasoning_effort
            
        }

        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.base_url, headers=headers, json=payload
                ) as response:

                    if response.status != 200:
                        error_text = await response.text()
                        print(f"Error response: {error_text}")
                        raise ValueError(
                            f"OpenAI API returned status code {response.status}: {error_text}"
                        )

                    line_count = 0
                    async for line in response.content:
                        line = line.decode("utf-8").strip()
                        if not line:
                            continue

                        line_count += 1

                        if line.startswith("data: "):
                            if line == "data: [DONE]":
                                break
                            try:
                                data = json.loads(line[6:])
                                content = (
                                    data.get("choices", [{}])[0]
                                    .get("delta", {})
                                    .get("content")
                                )
                                if content:
                                    yield content
                            except json.JSONDecodeError as e:
                                print(f"JSON decode error: {e} for line: {line}")
                                continue

                    if line_count == 0:
                        print("Warning: No lines received in stream response")

        except aiohttp.ClientError as e:
            print(f"Connection error: {str(e)}")
            raise ValueError(f"Failed to connect to OpenAI API: {str(e)}")
        except Exception as e:
            print(f"Unexpected error in streaming API call: {str(e)}")
            raise

    def count_tokens(self, prompt: str) -> int:
        """
        Counts the number of tokens in a prompt.

        Args:
            prompt (str): The prompt to count tokens for

        Returns:
            int: Estimated number of input tokens
        """
        num_tokens = len(self.encoding.encode(prompt))
        return num_tokens

