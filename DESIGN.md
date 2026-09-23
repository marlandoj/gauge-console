# Gauge Console visual system

## Scene and direction

A Hackyard visitor experiments with a task on a laptop in a bright afternoon workspace. Warm paper and dark ink keep the working surface legible; a copper needle makes the result easy to spot.

Visual thesis: a quiet measuring instrument on warm paper, with one moving needle and readable rule evidence. Product register; restrained color strategy.

## Structure

A compact brand header, two-column working area and a low-emphasis disclosure footer. Input, examples and harness context sit left; assessment and reasons sit right. Below 740 px these sections reflow vertically in the same document. No navigation or routed pages.

## Tokens and type

`public/styles.css` is the token source. Paper: OKLCH 96.4%/.01/90; surface: 98.5%/.006/90; ink: 27%/.015/110; secondary text: 46%/.018/90; copper accent: 52%/.16/40. The logo uses fixed SVG colors.

System sans for prose and native controls. System monospace for reason codes and measurement labels. One dominant solid Assess task button; secondary actions use neutral borders. Minimum controls are 44 px high, separated by at least 8 px.

## Motion and state

The needle rotates to a discrete tier over 550 ms using an ease-out curve. Hover feedback lasts 160 ms. Both transitions are removed for reduced motion. Loading, pending edits, empty input, abstention, oversize input and engine failure never display a current tier needle. Live text conveys the result without relying on shape or color.

## Content boundaries

Only matched reason codes are shown. Method detail expands inline. Compute timing measures the classifier call, not debounce or animation time. No fabricated confidence, traffic, model dispatch or production routing status.
