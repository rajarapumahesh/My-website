// Storage operations are synchronous and run in one SQLite transaction.
// The anonymous browser ID is unique, making retries and duplicate clicks idempotent.
export const isVisitorId = value => typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export function initialize(storage) {
    storage.sql.exec('CREATE TABLE IF NOT EXISTS hearts (visitor_id TEXT PRIMARY KEY)');
}

export function readCounter(storage, visitorId) {
    const count = storage.sql.exec('SELECT COUNT(*) AS count FROM hearts').one().count;
    const liked = isVisitorId(visitorId) && storage.sql.exec('SELECT visitor_id FROM hearts WHERE visitor_id = ?', visitorId).toArray().length > 0;
    return {count, liked};
}

export function addHeart(storage, visitorId) {
    if (!isVisitorId(visitorId)) throw new TypeError('Invalid visitor ID');
    return storage.transactionSync(() => {
        storage.sql.exec('INSERT OR IGNORE INTO hearts (visitor_id) VALUES (?)', visitorId);
        return readCounter(storage, visitorId);
    });
}
