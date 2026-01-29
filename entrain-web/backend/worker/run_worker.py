#!/usr/bin/env python3
"""
Run the RQ worker for Entrain jobs.
"""

import os
import sys

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv

load_dotenv()

from redis import Redis
from rq import Worker, Queue

if __name__ == "__main__":
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_conn = Redis.from_url(redis_url)

    # Create queue
    queue = Queue("entrain", connection=redis_conn)

    # Start worker
    print(f"Starting Entrain worker, listening on queue 'entrain'...")
    worker = Worker([queue], connection=redis_conn)
    worker.work()
