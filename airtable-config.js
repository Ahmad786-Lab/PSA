/**
 * Airtable → “Meet our board” on your site
 *
 * YOUR TABLE (from your base)
 * - Table name: Table 1
 * - Columns: Name | Fun Fact | Postion | Attachments
 *   (Airtable spells it “Postion” — the name must match exactly in fieldMap.role.)
 *
 * SETUP
 * 1) Base ID: open this base in Airtable. The URL looks like
 *    https://airtable.com/appXXXXXXXXXXXXXX/...
 *    Copy appXXXXXXXXXXXXXX → paste into baseId below.
 *
 * 2) Token: https://airtable.com/create/tokens
 *    - Add scope: data.records:read
 *    - Under “Access”, include this base (Untitled Base or whatever you renamed it)
 *    - Create token and paste into token below.
 *
 * 3) Save this file and open the site with a local server (not file://), e.g.:
 *    npx serve .
 *
 * OPTIONAL: show “Fun Fact” under the name instead of position → set fieldMap.role to "Fun Fact".
 */
window.PSA_AIRTABLE = {
  token:
    "patH0lWipt6WC53pN.b3fbfe25eba0574b7849a3e3fafdde010976090856e1e951dd94203a98d48646",
  /** Only the id from the URL: https://airtable.com/appXXXX/... → use appXXXX (no https, no /shr...) */
  baseId: "appLPn9InjyCJ21QD",
  tableName: "Table 1",
  /** Optional: exact name of a view (e.g. "Grid view") to control row order. */
  viewName: "",
  /** How many board members to pull (up to 500). */
  maxRecords: 200,
  /** Airtable column names (must match your grid exactly). */
  fieldMap: {
    name: "Name",
    role: "Postion",
    photo: "Attachments",
  },
};

/**
 * Events (Airtable)
 *
 * Create another table in the SAME base (recommended name: "Events") with columns:
 * - Date (date)  → example: 2026-09-15
 * - Title (text)
 * - Description (long text)
 *
 * Then set the tableName/fieldMap below to match your exact column names.
 */
window.PSA_AIRTABLE_EVENTS = {
  /** Events base + token (must have access to this base). */
  token: "patbilBPMJRgu0XDa.8a033da8ade697a875c93e1a915af712ac4111b91e3bf189f52bb4406b3d9be6",
  baseId: "appIWy1UC0SDpAJT5",
  /** Your Events table is named “Table 1” (from your screenshot). */
  tableName: "Table 1",
  /** Optional view for sorting/filtering (recommended: a view sorted by Date ascending). */
  viewName: "",
  /** Pull up to 200 events (cap 500). */
  maxRecords: 200,
  fieldMap: {
    date: "Date",
    title: "Title",
    description: "Description",
  },
};
