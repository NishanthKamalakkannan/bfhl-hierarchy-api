# SRM Full Stack Engineering Challenge

This project implements:
- `POST /bfhl` API exactly as required in the challenge PDF
- A frontend SPA to submit node inputs and view structured API output

## Features Implemented

- Strict edge validation for `X->Y` where `X` and `Y` are single uppercase letters
- Invalid entry capture (`invalid_entries`)
- Duplicate edge capture once (`duplicate_edges`)
- Multi-parent rule handling (first parent wins; later edges discarded)
- Independent hierarchy grouping
- Cycle detection per group (`has_cycle: true`, `tree: {}`, no `depth`)
- Depth calculation for non-cyclic trees
- Correct summary fields:
  - `total_trees`
  - `total_cycles`
  - `largest_tree_root` with lexicographic tie-break
- CORS enabled
- JSON request validation

## Run Locally

1. Install dependencies:
   - `npm install`
2. Set identity fields (required for evaluation):
   - Copy `.env.example` values into environment variables:
     - `USER_ID`
     - `EMAIL_ID`
     - `COLLEGE_ROLL_NUMBER`
3. Start:
   - `npm run dev` (watch mode)
   - or `npm start`

Server defaults to `http://localhost:3000`.
Frontend is served from `/`.

## API Contract

### Request

`POST /bfhl`

```json
{
  "data": ["A->B", "A->C", "B->D"]
}
```

### Response Shape

```json
{
  "user_id": "fullname_ddmmyyyy",
  "email_id": "you@college.edu",
  "college_roll_number": "21CS1001",
  "hierarchies": [],
  "invalid_entries": [],
  "duplicate_edges": [],
  "summary": {
    "total_trees": 0,
    "total_cycles": 0,
    "largest_tree_root": ""
  }
}
```

## Test

- Run: `npm test`

Includes checks for:
- invalid and duplicate handling
- multi-parent behavior
- cycle behavior
- sample summary from the paper

## Hosting Suggestions

- API + frontend can be hosted together on:
  - [Render](https://render.com/)
  - [Railway](https://railway.app/)
  - [Vercel](https://vercel.com/)
- Submit:
  - Hosted API URL (`<base>/bfhl`)
  - Hosted frontend URL
  - Public GitHub repository URL
