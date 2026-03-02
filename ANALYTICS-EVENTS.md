# Analytics Event Map

This portfolio sends interaction events via `dataLayer.push` using the `select_content` event name.

## Event Name

- `select_content`

## Common Parameters

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

## Recommended GA4 Custom Dimensions (Event Scope)

- `content_type`
- `section_name`
- `interaction_action`
- `element_type`
- `element_label`
- `link_type`
- `modal_name`
- `open_source`
- `evidence_phase`

## Recommended GA4 Custom Metric (Event Scope)

- `value` (integer)

## GTM Trigger Tip

Use a Custom Event trigger:

- Event name: `select_content`

Then map parameters from Data Layer Variables with the same keys.
