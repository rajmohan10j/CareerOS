class AIProviderError(Exception):
    pass


class AITimeoutError(AIProviderError):
    def __init__(self, operation: str, timeout: int) -> None:
        self.operation = operation
        self.timeout = timeout
        super().__init__(f"AI {operation} timed out after {timeout}s")


class AIRetryError(AIProviderError):
    def __init__(self, operation: str, retries: int) -> None:
        self.operation = operation
        self.retries = retries
        super().__init__(f"AI {operation} failed after {retries} retries")


class AIProviderNotAvailable(AIProviderError):
    def __init__(self, provider: str) -> None:
        self.provider = provider
        super().__init__(f"AI provider '{provider}' is not available")
