import logging
import os

def setup_logger():
    """
    Sets up a logger that logs to both stdout/stderr and a file 'app.log' in the backend directory.
    Prevents duplicate handlers if initialized multiple times.
    """
    logger = logging.getLogger("smartcapture")
    logger.setLevel(logging.INFO)
    
    if not logger.handlers:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
        )
        
        # Console Handler
        console_handler = logging.StreamHandler()
        console_handler.setFormatter(formatter)
        logger.addHandler(console_handler)
        
        # File Handler (only for development/testing environments to avoid write issues in serverless/containers)
        flask_env = os.getenv("FLASK_ENV", "development")
        if flask_env != "production":
            try:
                log_file = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app.log")
                file_handler = logging.FileHandler(log_file, encoding='utf-8')
                file_handler.setFormatter(formatter)
                logger.addHandler(file_handler)
            except Exception as e:
                # Fallback gracefully
                console_handler.setLevel(logging.INFO)
                logger.warning(f"Could not initialize file logging handler: {e}")
                
    return logger

logger = setup_logger()
