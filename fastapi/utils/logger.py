import logging
import sys
from typing import Optional

def setup_logger(name: str, level: int = logging.INFO, log_to_file: bool = False, log_file: Optional[str] = None) -> logging.Logger:
    """
    Set up a logger with consistent formatting and configuration.
    
    Args:
        name (str): Logger name (usually __name__)
        level (int): Logging level (default: INFO)
        log_to_file (bool): Whether to log to file (default: False)
        log_file (Optional[str]): Log file path if log_to_file is True
        
    Returns:
        logging.Logger: Configured logger instance
    """
    logger = logging.getLogger(name)
    
    # Avoid adding handlers multiple times
    if logger.handlers:
        return logger
    
    logger.setLevel(level)
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler (optional)
    if log_to_file and log_file:
        try:
            file_handler = logging.FileHandler(log_file)
            file_handler.setLevel(level)
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
        except Exception as e:
            logger.warning(f"Failed to set up file logging to {log_file}: {e}")
    
    return logger

def get_logger(name: str) -> logging.Logger:
    """
    Get a logger instance. If it doesn't exist, create it with default settings.
    
    Args:
        name (str): Logger name (usually __name__)
        
    Returns:
        logging.Logger: Logger instance
    """
    logger = logging.getLogger(name)
    
    # If logger has no handlers, set it up with defaults
    if not logger.handlers:
        setup_logger(name)
    
    return logger

# Set up root logger for the application
def setup_app_logging(level: int = logging.INFO, log_to_file: bool = False, log_file: Optional[str] = None):
    """
    Set up the root application logger.
    
    Args:
        level (int): Logging level (default: INFO)
        log_to_file (bool): Whether to log to file (default: False)
        log_file (Optional[str]): Log file path if log_to_file is True
    """
    root_logger = logging.getLogger()
    root_logger.setLevel(level)
    
    # Clear existing handlers
    for handler in root_logger.handlers[:]:
        root_logger.removeHandler(handler)
    
    # Set up root logger
    setup_logger("cyclone", level, log_to_file, log_file) 