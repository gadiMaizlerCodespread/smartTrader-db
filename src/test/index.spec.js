import { expect } from 'chai';
import { foo, goo } from '../index';

describe('Stub tests', () => {

    before(() => {
        console.log('before');
    });

    after(async () => {
        console.log('after');
    });

    describe('foo', async () => {
        it('foo always returns 8', async () => {
            const res = await foo();
            expect(res).to.be.equal(8);
        });
    });

});