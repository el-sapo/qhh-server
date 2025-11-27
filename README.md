# QHH Server

A lightweight Node server that exposes a JSON API for the latest QHH issue and a small UI for updating the title or file URL. The `updated_date` is automatically refreshed whenever either field changes.

## Endpoints

- `GET /api/info` – Returns the current metadata in the format:

  ```json
  {
    "updated_date": "2025-01-01T00:00:00.000Z",
    "file_url": "https://github.com/fedelagarmilla/qhh-revista/blob/main/QHH-327.pdf",
    "title": "QHH - 327"
  }
  ```

- `PUT /api/info` – Update the `title` and/or `file_url`. Only these fields are accepted; `updated_date` is recalculated automatically. Example:

  ```bash
  curl -X PUT http://localhost:3000/api/info \
    -H "Content-Type: application/json" \
    -d '{"title":"QHH - 328","file_url":"https://example.com/QHH-328.pdf"}'
  ```

## Running the server

1. Install Node.js (version 18 or newer is recommended).
2. Start the server:

   ```bash
   npm start
   ```

3. Open the UI in your browser at [http://localhost:3000](http://localhost:3000). Use the form to change the title or file URL; the API will reflect the new values and update the `updated_date` automatically.

Data is stored in `data/store.json`, which is updated whenever the API state changes.
