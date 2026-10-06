import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { initialize, addHeart, readCounter, isVisitorId } from './counter.js';

function storage(db) {
    return {
        sql: {exec(query, ...values) {
            const statement = db.prepare(query);
            const rows = statement.columns().length ? statement.all(...values) : (statement.run(...values), []);
            return {one: () => rows[0], toArray: () => rows};
        }},
        transactionSync(callback) {
            db.exec('BEGIN IMMEDIATE');
            try { const result = callback(); db.exec('COMMIT'); return result; }
            catch (error) { db.exec('ROLLBACK'); throw error; }
        },
    };
}

test('distinct browser hearts increase the shared total; duplicate/retried writes do not', () => {
    const db = new DatabaseSync(':memory:');
    const store = storage(db); initialize(store);
    const first = randomUUID(), second = randomUUID();
    assert.deepEqual(readCounter(store, first), {count:0,liked:false});
    assert.deepEqual(addHeart(store, first), {count:1,liked:true});
    assert.deepEqual(addHeart(store, first), {count:1,liked:true});
    assert.deepEqual(addHeart(store, second), {count:2,liked:true});
    assert.deepEqual(readCounter(store, first), {count:2,liked:true});
    // Re-initializing a storage instance must preserve its existing rows.
    initialize(store);
    assert.deepEqual(readCounter(store, randomUUID()), {count:2,liked:false});
    db.close();
});

test('many distinct visitors and retries produce exactly one row per browser', async () => {
    const db = new DatabaseSync(':memory:'); const store = storage(db); initialize(store);
    const visitors = Array.from({length:100}, () => randomUUID());
    await Promise.all([...visitors, ...visitors].map(id => Promise.resolve().then(() => addHeart(store, id))));
    assert.equal(readCounter(store).count, 100);
    db.close();
});

test('invalid IDs cannot add rows', () => {
    const db = new DatabaseSync(':memory:'); const store = storage(db); initialize(store);
    for (const id of [null, '', 'not-a-uuid', "'; DROP TABLE hearts;--"]) {
        assert.equal(isVisitorId(id), false);
        assert.throws(() => addHeart(store, id));
    }
    assert.deepEqual(readCounter(store), {count:0,liked:false});
    db.close();
});
