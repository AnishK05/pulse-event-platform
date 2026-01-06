#!/usr/bin/env python3
"""
Load Generator for Pulse Event Platform

Simulates event producers with various scenarios:
- Normal events
- Duplicate events (same idempotency key)
- Malformed events (missing required fields)
- Multi-tenant traffic
"""

import argparse
import json
import random
import string
import time
from datetime import datetime, timezone
from typing import Dict, List
import requests
from statistics import mean, quantiles


class LoadGenerator:
    def __init__(
        self,
        url: str,
        tenants: List[str],
        api_keys: Dict[str, str],
        rps: int,
        duration_minutes: int,
        duplicate_rate: float,
        bad_rate: float,
    ):
        self.url = url
        self.tenants = tenants
        self.api_keys = api_keys
        self.rps = rps
        self.duration_minutes = duration_minutes
        self.duplicate_rate = duplicate_rate
        self.bad_rate = bad_rate
        
        # Statistics
        self.stats = {
            'total_sent': 0,
            'success': 0,
            'duplicate': 0,
            'rate_limited': 0,
            'bad_request': 0,
            'error': 0,
            'latencies': []
        }
        
        # Store some idempotency keys for generating duplicates
        self.used_idem_keys = []

    def generate_event(self, is_duplicate: bool = False, is_bad: bool = False) -> Dict:
        """Generate a test event"""
        event_id = f"evt_{self._random_string(10)}"
        
        event = {
            "event_id": event_id,
            "event_type": random.choice(["user_login", "user_logout", "page_view", "purchase", "signup"]),
            "schema_version": 1,
            "occurred_at": datetime.now(timezone.utc).isoformat(),
            "payload": {
                "user_id": f"user_{random.randint(1000, 9999)}",
                "ip": f"{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}.{random.randint(1,255)}",
                "session_id": self._random_string(20),
                "data": {"key": "value", "count": random.randint(1, 100)}
            }
        }
        
        # Make event malformed if requested
        if is_bad:
            # Randomly remove a required field
            field_to_remove = random.choice(["event_type", "schema_version", "occurred_at"])
            del event[field_to_remove]
        
        return event

    def generate_idempotency_key(self, is_duplicate: bool = False) -> str:
        """Generate an idempotency key, possibly a duplicate"""
        if is_duplicate and self.used_idem_keys:
            # Return a previously used key
            return random.choice(self.used_idem_keys)
        else:
            # Generate new key
            key = f"idem_{self._random_string(16)}"
            self.used_idem_keys.append(key)
            # Keep only last 100 keys to avoid memory issues
            if len(self.used_idem_keys) > 100:
                self.used_idem_keys.pop(0)
            return key

    def send_event(self, tenant: str, event: Dict, idempotency_key: str) -> Dict:
        """Send an event to the ingestion API"""
        headers = {
            "Content-Type": "application/json",
            "X-API-Key": self.api_keys[tenant],
            "Idempotency-Key": idempotency_key
        }
        
        start_time = time.time()
        try:
            response = requests.post(self.url, json=event, headers=headers, timeout=5)
            latency = (time.time() - start_time) * 1000  # Convert to ms
            
            return {
                "status_code": response.status_code,
                "latency": latency,
                "response": response.json() if response.headers.get('content-type') == 'application/json' else {}
            }
        except requests.exceptions.Timeout:
            return {"status_code": 0, "latency": 5000, "error": "timeout"}
        except Exception as e:
            return {"status_code": 0, "latency": 0, "error": str(e)}

    def run(self):
        """Run the load test"""
        print(f"🚀 Starting load test")
        print(f"   URL: {self.url}")
        print(f"   Tenants: {', '.join(self.tenants)}")
        print(f"   RPS: {self.rps}")
        print(f"   Duration: {self.duration_minutes} minutes")
        print(f"   Duplicate rate: {self.duplicate_rate * 100}%")
        print(f"   Bad event rate: {self.bad_rate * 100}%")
        print()
        
        start_time = time.time()
        end_time = start_time + (self.duration_minutes * 60)
        
        interval = 1.0 / self.rps  # Time between requests
        
        while time.time() < end_time:
            iteration_start = time.time()
            
            # Select tenant
            tenant = random.choice(self.tenants)
            
            # Determine event characteristics
            is_duplicate = random.random() < self.duplicate_rate
            is_bad = random.random() < self.bad_rate
            
            # Generate event
            event = self.generate_event(is_duplicate=False, is_bad=is_bad)
            idempotency_key = self.generate_idempotency_key(is_duplicate=is_duplicate)
            
            # Send event
            result = self.send_event(tenant, event, idempotency_key)
            
            # Update statistics
            self.stats['total_sent'] += 1
            
            if result['status_code'] == 202:
                if result.get('response', {}).get('duplicate'):
                    self.stats['duplicate'] += 1
                else:
                    self.stats['success'] += 1
                self.stats['latencies'].append(result['latency'])
            elif result['status_code'] == 429:
                self.stats['rate_limited'] += 1
            elif result['status_code'] == 400:
                self.stats['bad_request'] += 1
            else:
                self.stats['error'] += 1
            
            # Print progress every 10 requests
            if self.stats['total_sent'] % 10 == 0:
                elapsed = time.time() - start_time
                self._print_progress(elapsed)
            
            # Sleep to maintain RPS
            elapsed = time.time() - iteration_start
            if elapsed < interval:
                time.sleep(interval - elapsed)
        
        # Final report
        total_time = time.time() - start_time
        self._print_final_report(total_time)

    def _print_progress(self, elapsed: float):
        """Print progress update"""
        actual_rps = self.stats['total_sent'] / elapsed if elapsed > 0 else 0
        print(f"\r📊 Sent: {self.stats['total_sent']} | "
              f"✅ Success: {self.stats['success']} | "
              f"🔁 Dup: {self.stats['duplicate']} | "
              f"⚠️  Rate Limited: {self.stats['rate_limited']} | "
              f"❌ Bad: {self.stats['bad_request']} | "
              f"🔥 Error: {self.stats['error']} | "
              f"RPS: {actual_rps:.1f}", end='')

    def _print_final_report(self, total_time: float):
        """Print final statistics report"""
        print("\n")
        print("=" * 80)
        print("📈 LOAD TEST COMPLETE")
        print("=" * 80)
        print(f"\n⏱️  Total Duration: {total_time:.2f} seconds")
        print(f"📤 Total Requests: {self.stats['total_sent']}")
        print(f"✅ Successful: {self.stats['success']} ({self._percentage(self.stats['success'])}%)")
        print(f"🔁 Duplicates: {self.stats['duplicate']} ({self._percentage(self.stats['duplicate'])}%)")
        print(f"⚠️  Rate Limited: {self.stats['rate_limited']} ({self._percentage(self.stats['rate_limited'])}%)")
        print(f"❌ Bad Requests: {self.stats['bad_request']} ({self._percentage(self.stats['bad_request'])}%)")
        print(f"🔥 Errors: {self.stats['error']} ({self._percentage(self.stats['error'])}%)")
        
        if self.stats['latencies']:
            print(f"\n📊 Latency Statistics (ms):")
            print(f"   Average: {mean(self.stats['latencies']):.2f}")
            print(f"   Min: {min(self.stats['latencies']):.2f}")
            print(f"   Max: {max(self.stats['latencies']):.2f}")
            if len(self.stats['latencies']) >= 4:
                p50, p95, p99 = quantiles(self.stats['latencies'], n=100)[49], \
                                quantiles(self.stats['latencies'], n=100)[94], \
                                quantiles(self.stats['latencies'], n=100)[98]
                print(f"   P50: {p50:.2f}")
                print(f"   P95: {p95:.2f}")
                print(f"   P99: {p99:.2f}")
        
        actual_rps = self.stats['total_sent'] / total_time if total_time > 0 else 0
        print(f"\n🚀 Actual RPS: {actual_rps:.2f}")
        print("=" * 80)

    def _percentage(self, count: int) -> str:
        """Calculate percentage of total"""
        if self.stats['total_sent'] == 0:
            return "0.0"
        return f"{(count / self.stats['total_sent'] * 100):.1f}"

    @staticmethod
    def _random_string(length: int) -> str:
        """Generate a random string"""
        return ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))


def main():
    parser = argparse.ArgumentParser(description="Load Generator for Pulse Event Platform")
    parser.add_argument("--url", default="http://localhost:8080/events", help="Ingestion API URL")
    parser.add_argument("--rps", type=int, default=50, help="Requests per second")
    parser.add_argument("--minutes", type=int, default=1, help="Duration in minutes")
    parser.add_argument("--duplicate-rate", type=float, default=0.1, help="Rate of duplicate events (0.0-1.0)")
    parser.add_argument("--bad-rate", type=float, default=0.05, help="Rate of malformed events (0.0-1.0)")
    parser.add_argument("--tenants", default="tenant_a,tenant_b", help="Comma-separated list of tenant IDs")
    
    args = parser.parse_args()
    
    # Parse tenants
    tenants = [t.strip() for t in args.tenants.split(",")]
    
    # Default API keys (should match the Go service config)
    api_keys = {
        "tenant_a": "key_a",
        "tenant_b": "key_b",
    }
    
    # Validate parameters
    if args.rps <= 0:
        print("Error: RPS must be positive")
        return
    
    if args.minutes <= 0:
        print("Error: Duration must be positive")
        return
    
    if not 0 <= args.duplicate_rate <= 1:
        print("Error: Duplicate rate must be between 0 and 1")
        return
    
    if not 0 <= args.bad_rate <= 1:
        print("Error: Bad rate must be between 0 and 1")
        return
    
    # Run load test
    generator = LoadGenerator(
        url=args.url,
        tenants=tenants,
        api_keys=api_keys,
        rps=args.rps,
        duration_minutes=args.minutes,
        duplicate_rate=args.duplicate_rate,
        bad_rate=args.bad_rate,
    )
    
    try:
        generator.run()
    except KeyboardInterrupt:
        print("\n\n⚠️  Load test interrupted by user")
        generator._print_final_report(time.time())


if __name__ == "__main__":
    main()



