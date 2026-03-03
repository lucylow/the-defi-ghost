import os
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    # OpenClaw
    OPENCLAW_API_KEY: str = os.getenv("OPENCLAW_API_KEY", "")
    OPENCLAW_TEAM_ID: str = os.getenv("OPENCLAW_TEAM_ID", "")

    # Ethoswarm (Animoca Minds)
    ETHOSWARM_API_KEY: str = os.getenv("ETHOSWARM_API_KEY", "")
    ETHOSWARM_MEMORY_STORE_ID: str = os.getenv("ETHOSWARM_MEMORY_STORE_ID", "")

    # LLM Provider (OpenAI or Venice.ai) — see AI_MODELS.md
    LLM_PROVIDER: str = os.getenv("LLM_PROVIDER", "openai")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4")
    VENICE_API_KEY: str = os.getenv("VENICE_API_KEY", "")
    VENICE_API_BASE: str = os.getenv("VENICE_API_BASE", "https://api.venice.ai/v1")
    VENICE_MODEL: str = os.getenv("VENICE_MODEL", "venice-v1")

    # Blockchain RPCs
    RPC_URLS: dict = {
        "ethereum": os.getenv("ETH_RPC_URL", "https://eth.llamarpc.com"),
        "arbitrum": os.getenv("ARBITRUM_RPC_URL", "https://arb1.arbitrum.io/rpc"),
        "base": os.getenv("BASE_RPC_URL", "https://mainnet.base.org"),
    }

    # Protocol addresses (simplified placeholders)
    PROTOCOLS: dict = {
        "aave_v3_arbitrum": "0x794a61358D6845594F94dc1DB02A252b5b4814aD",
        "compound_v3_arbitrum": "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
        "morpho_blue_base": "0xBBBBBbbBBb9cC5e90e3b3Af64bdAF62C37EEFFCb",
    }

    # Redis for short-term state
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379")

    class Config:
        env_file = ".env"


settings = Settings()
