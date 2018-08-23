console.log('Hello World!');
foo();

async function foo() {
    const res = await new Promise((resolve) => resolve(5));
    console.log(res);
    return res;
}

function goo() { return 5; }

// block comment
const obj = { a: 1 };// line comment
const array = [6, 6];

let d = 9;
d = 6 + 7;

module.exports = { goo, foo };