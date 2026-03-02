# Analytics Event Map

This portfolio sends interaction events via `dataLayer.push` using the `select_content` event name.

## Event Name

- `select_content`

## Common Parameters

- `session_id`
- `content_type`
- `item_id`
- `item_name`
- `section_name`
- `interaction_action`
- `element_type`
- `element_label`
- `link_url`
- `link_type`
- `modal_name`
- `value`
- `duration_ms`
- `engagement_time_msec`
- `hidden_duration_ms`
- `max_scroll_percent`
- `unique_case_views`
- `end_reason`
- `page_type`
- `link_role`
- `destination_case`
- `evidence_tier`
- `evidence_pair`
- `evidence_pair_index`

## content_type Values

- `navigation`
- `navigation_case`
- `contact_action`
- `case_link`
- `performance_evidence`
- `extra_evidence_button`
- `extra_evidence`
- `extra_evidence_preview`
- `extra_evidence_zoom`
- `extra_evidence_original`
- `mermaid_diagram`
- `mermaid_zoom`
- `section_view`
- `section_dwell`
- `page_engagement`
- `page_visibility`

## Recommended GA4 Custom Dimensions (Event Scope)

- `session_id`
- `content_type`
- `section_name`
- `interaction_action`
- `element_type`
- `element_label`
- `link_type`
- `modal_name`
- `open_source`
- `evidence_phase`
- `end_reason`

## Recommended GA4 Custom Metric (Event Scope)

- `value` (integer)
- `duration_ms` (integer)
- `engagement_time_msec` (integer)
- `hidden_duration_ms` (integer)
- `max_scroll_percent` (integer)
- `unique_case_views` (integer)

## GTM Trigger Tip

Use a Custom Event trigger:

- Event name: `select_content`

Then map parameters from Data Layer Variables with the same keys.

## Page Coverage

- `index.html`: main cards, nav, contact, diagrams, evidence interactions.
- `case-detail.html`: case list cards, `BACK_TO_PORTFOLIO`, case navigation buttons, traceability links, Before/After evidence frame links, evidence modal (`open_modal`, `navigate_modal`, `open_original`, `close_modal`), page lifecycle events.
