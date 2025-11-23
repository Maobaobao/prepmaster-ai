import os
import json
from abc import ABC, abstractmethod
from google import genai
from google.genai import types
from openai import OpenAI

# Constants
SYSTEM_INSTRUCTION_TEMPLATE = """
You are an expert technical interviewer for a {{JOB_TITLE}} role at {{COMPANY}}. 
Your goal is to assess the candidate's suitability based on the Job Description and their CV.

JOB DESCRIPTION:
{{JOB_DESCRIPTION}}

CANDIDATE CV:
{{CV_CONTENT}}

INSTRUCTIONS:
1. Conduct a realistic, professional interview.
2. Ask one question at a time.
3. Start by introducing yourself and asking the first question.
4. Dig deeper into their experience if their answers are vague.
5. Be polite but rigorous.
6. Keep your responses concise (under 3 sentences) to keep the conversation flowing, unless explaining a complex concept.
"""

class AIProvider(ABC):
    @abstractmethod
    def start_interview(self, job_title, company, job_description, cv_content):
        pass

    @abstractmethod
    def generate_turn(self, job_title, company, job_description, cv_content, history, latest_user_message):
        pass

    @abstractmethod
    def generate_feedback(self, job_description, cv_content, history):
        pass

class GeminiProvider(AIProvider):
    def __init__(self):
        self.client = genai.Client(api_key=os.getenv('GEMINI_API_KEY'))

    def _get_system_instruction(self, job_title, company, job_description, cv_content):
        return SYSTEM_INSTRUCTION_TEMPLATE.replace('{{JOB_TITLE}}', job_title) \
            .replace('{{COMPANY}}', company) \
            .replace('{{JOB_DESCRIPTION}}', job_description) \
            .replace('{{CV_CONTENT}}', cv_content)

    def start_interview(self, job_title, company, job_description, cv_content):
        system_instruction = self._get_system_instruction(job_title, company, job_description, cv_content)
        
        try:
            response = self.client.models.generate_content(
                model='gemini-2.5-flash-preview-tts',
                contents="Start the interview. Introduce yourself as the AI interviewer and ask the first question.",
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name='Kore')
                        )
                    )
                )
            )
            
            # For TTS model, we might need a separate call for text or infer it.
            # To keep it simple and consistent with previous logic:
            text_response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents="Start the interview. Introduce yourself as the AI interviewer and ask the first question.",
                config=types.GenerateContentConfig(system_instruction=system_instruction)
            )
            
            audio_data = None
            if response.candidates and response.candidates[0].content.parts:
                for part in response.candidates[0].content.parts:
                    if part.inline_data:
                        audio_data = part.inline_data.data
            
            return {
                'text': text_response.text,
                'audioData': audio_data
            }
        except Exception as e:
            print(f"Gemini Error: {e}")
            raise e

    def generate_turn(self, job_title, company, job_description, cv_content, history, latest_user_message):
        system_instruction = self._get_system_instruction(job_title, company, job_description, cv_content)
        
        # Convert history to Gemini format
        contents = []
        for msg in history:
            role = 'user' if msg['sender'] == 'USER' else 'model'
            contents.append(types.Content(role=role, parts=[types.Part(text=msg['text'])]))
            
        # Add latest user message
        user_parts = []
        if isinstance(latest_user_message, str):
            user_parts.append(types.Part(text=latest_user_message))
        elif isinstance(latest_user_message, dict) and 'audioData' in latest_user_message:
             user_parts.append(types.Part(inline_data=types.Blob(
                 mime_type=latest_user_message['mimeType'],
                 data=latest_user_message['audioData']
             )))
        
        contents.append(types.Content(role='user', parts=user_parts))

        try:
            # 1. Generate Text
            text_resp = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=contents,
                config=types.GenerateContentConfig(system_instruction=system_instruction)
            )
            ai_text = text_resp.text or "I didn't catch that."

            # 2. Generate Audio
            tts_resp = self.client.models.generate_content(
                model='gemini-2.5-flash-preview-tts',
                contents=ai_text,
                config=types.GenerateContentConfig(
                    response_modalities=["AUDIO"],
                    speech_config=types.SpeechConfig(
                        voice_config=types.VoiceConfig(
                            prebuilt_voice_config=types.PrebuiltVoiceConfig(voice_name='Puck')
                        )
                    )
                )
            )
            
            audio_data = None
            if tts_resp.candidates and tts_resp.candidates[0].content.parts:
                for part in tts_resp.candidates[0].content.parts:
                    if part.inline_data:
                        audio_data = part.inline_data.data

            return {
                'text': ai_text,
                'audioData': audio_data
            }
        except Exception as e:
            print(f"Gemini Error: {e}")
            raise e

    def generate_feedback(self, job_description, cv_content, history):
        transcript = "\n".join([f"{m['sender']}: {m['text']}" for m in history])
        prompt = f"""
        Analyze the following interview transcript.
        Job Description: {job_description}
        Candidate CV: {cv_content}
        
        TRANSCRIPT:
        {transcript}
        
        Provide a detailed evaluation in JSON format with: overallScore, strengths, weaknesses, improvements, summary.
        """
        
        try:
            response = self.client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema={
                        "type": "OBJECT",
                        "properties": {
                            "overallScore": {"type": "NUMBER"},
                            "strengths": {"type": "ARRAY", "items": {"type": "STRING"}},
                            "weaknesses": {"type": "ARRAY", "items": {"type": "STRING"}},
                            "improvements": {"type": "ARRAY", "items": {"type": "STRING"}},
                            "summary": {"type": "STRING"},
                        },
                        "required": ["overallScore", "strengths", "weaknesses", "improvements", "summary"]
                    }
                )
            )
            return json.loads(response.text)
        except Exception as e:
            print(f"Gemini Feedback Error: {e}")
            return None

class OpenAIProvider(AIProvider):
    def __init__(self, api_key=None, base_url=None, model="gpt-4o"):
        self.client = OpenAI(api_key=api_key, base_url=base_url)
        self.model = model

    def _get_system_instruction(self, job_title, company, job_description, cv_content):
        return SYSTEM_INSTRUCTION_TEMPLATE.replace('{{JOB_TITLE}}', job_title) \
            .replace('{{COMPANY}}', company) \
            .replace('{{JOB_DESCRIPTION}}', job_description) \
            .replace('{{CV_CONTENT}}', cv_content)

    def start_interview(self, job_title, company, job_description, cv_content):
        system_instruction = self._get_system_instruction(job_title, company, job_description, cv_content)
        messages = [
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": "Start the interview. Introduce yourself as the AI interviewer and ask the first question."}
        ]
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages
            )
            text = response.choices[0].message.content
            
            # OpenAI TTS (Optional, if not DeepSeek)
            audio_data = None
            if "gpt" in self.model: # Only use OpenAI TTS for OpenAI models
                try:
                    tts_response = self.client.audio.speech.create(
                        model="tts-1",
                        voice="alloy",
                        input=text
                    )
                    # Convert to base64
                    import base64
                    audio_data = base64.b64encode(tts_response.content).decode('utf-8')
                except Exception as e:
                    print(f"OpenAI TTS Error: {e}")

            return {'text': text, 'audioData': audio_data}
        except Exception as e:
            print(f"OpenAI Error: {e}")
            raise e

    def generate_turn(self, job_title, company, job_description, cv_content, history, latest_user_message):
        system_instruction = self._get_system_instruction(job_title, company, job_description, cv_content)
        messages = [{"role": "system", "content": system_instruction}]
        
        for msg in history:
            role = 'user' if msg['sender'] == 'USER' else 'assistant'
            messages.append({"role": role, "content": msg['text']})
            
        if isinstance(latest_user_message, str):
            messages.append({"role": "user", "content": latest_user_message})
        else:
            # Handle audio input (STT) if needed, but for now assume text or handle elsewhere
            # OpenAI API doesn't accept audio directly in chat completion (except GPT-4o-audio which is preview)
            # For this implementation, we assume text input or pre-transcribed audio
            messages.append({"role": "user", "content": "(Audio input not supported directly in this provider yet)"})

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages
            )
            text = response.choices[0].message.content
            
            audio_data = None
            if "gpt" in self.model:
                try:
                    tts_response = self.client.audio.speech.create(
                        model="tts-1",
                        voice="alloy",
                        input=text
                    )
                    import base64
                    audio_data = base64.b64encode(tts_response.content).decode('utf-8')
                except Exception as e:
                     print(f"OpenAI TTS Error: {e}")

            return {'text': text, 'audioData': audio_data}
        except Exception as e:
            print(f"OpenAI Error: {e}")
            raise e

    def generate_feedback(self, job_description, cv_content, history):
        transcript = "\n".join([f"{m['sender']}: {m['text']}" for m in history])
        prompt = f"""
        Analyze the following interview transcript.
        Job Description: {job_description}
        Candidate CV: {cv_content}
        
        TRANSCRIPT:
        {transcript}
        
        Provide a detailed evaluation in JSON format with: overallScore, strengths, weaknesses, improvements, summary.
        """
        
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            print(f"OpenAI Feedback Error: {e}")
            return None

class DeepSeekProvider(OpenAIProvider):
    def __init__(self):
        super().__init__(
            api_key=os.getenv('DEEPSEEK_API_KEY'),
            base_url="https://api.deepseek.com",
            model="deepseek-chat"
        )
    
    # DeepSeek inherits OpenAI logic but uses DeepSeek API URL and Model
    # Note: DeepSeek does not support TTS, so audioData will be None

def get_ai_provider(provider_name='gemini'):
    if provider_name == 'openai':
        return OpenAIProvider(api_key=os.getenv('OPENAI_API_KEY'))
    elif provider_name == 'deepseek':
        return DeepSeekProvider()
    else:
        return GeminiProvider()
