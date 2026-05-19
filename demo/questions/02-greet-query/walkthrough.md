# Walkthrough — Query strings

## Where query params come from

For a URL like `/greet?name=Ada&lang=en`, Express parses the part after `?`
into `req.query`:

```js
req.query // => { name: 'Ada', lang: 'en' }
```

This parsing is automatic — no middleware needed. (Body parsing, which we'll
meet later, *does* need middleware.)

## Always strings (mostly)

Query values arrive as **strings**, never numbers or booleans:

```
/items?limit=10  →  req.query.limit === '10'   // string!
/flag?on=true    →  req.query.on === 'true'    // string!
```

If you need a number, coerce explicitly: `Number(req.query.limit)` and
validate the result.

Repeated keys become arrays: `/q?tag=a&tag=b` → `req.query.tag === ['a','b']`.

## Handling "missing" vs "empty"

Two distinct cases both mean "no name given":

- **Missing**: `/greet` → `req.query.name === undefined`
- **Empty**: `/greet?name=` → `req.query.name === ''`

A single idiom handles both:

```js
const name = req.query.name || 'stranger';
```

`||` falls through for `undefined`, `null`, and `''` — exactly what we want.
If you needed to keep empty strings meaningful, you'd use `??` (nullish
coalescing) instead, which only falls through for `undefined`/`null`.

## Putting it together

```js
app.get('/greet', (req, res) => {
  const name = req.query.name || 'stranger';
  res.send(`Hello, ${name}!`);
});
```

No explicit `res.status(200)` — 200 is the default. No explicit
`Content-Type` — `res.send(string)` sets `text/html; charset=utf-8` for you,
which satisfies the "starts with `text/`" test.

## Security footnote

In a real app you'd want to:

- **Validate length** (`name.slice(0, 100)`) so users can't send megabytes.
- **Escape output** if this string ends up in HTML. Raw interpolation into
  HTML is an XSS vector. For plain-text responses like ours it's fine.

We skip both here to keep the lesson focused, but keep them in mind.
