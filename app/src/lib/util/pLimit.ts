// A simple concurrency limiter. Returns a wrapper function that enqueues
// tasks and ensures that at most `n` promises are running at once.
// Usage:
//   const limit = pLimit(4);
//   const results = await Promise.all(items.map(item => limit(() => doWork(item))));
export function pLimit(n: number) {
    let active = 0;
    const queue: Array<() => void> = [];
    const next = () => {
        active--;
        const fn = queue.shift();
        if (fn) fn();
    };
    return function <T>(fn: () => Promise<T>): Promise<T> {
        return new Promise((resolve, reject) => {
            const run = () => {
                active++;
                fn().then((val) => {
                    next();
                    resolve(val);
                }, (err) => {
                    next();
                    reject(err);
                });
            };
            if (active < n) run(); else queue.push(run);
        });
    };
}