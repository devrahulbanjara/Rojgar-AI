export const resumePrintStyles = `
  @import url('https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600&display=swap');

  * {
    box-sizing: border-box;
  }

  html,
  body {
    margin: 0;
    padding: 0;
    background: #ffffff;
    color: #000000;
    font-family: 'EB Garamond', Garamond, 'Times New Roman', serif;
    font-size: 11pt;
    line-height: 1.45;
    font-optical-sizing: auto;
    font-kerning: normal;
    text-rendering: optimizeLegibility;
  }

  body {
    padding: 0;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  .resume-page,
  .rv-doc {
    max-width: 8.5in;
    margin: 0 auto;
    padding: 0.5in;
    background: #ffffff;
  }

  .rv-header {
    margin-bottom: 0.18in;
    text-align: center;
  }

  .rv-header__name {
    margin: 0;
    font-family: 'EB Garamond', Garamond, 'Times New Roman', serif;
    font-size: 1.8rem;
    line-height: 1.05;
    font-weight: 400;
    font-variation-settings: "wght" 400;
    font-synthesis-weight: none;
    letter-spacing: 0.015em;
  }

  .rv-header__headline {
    margin: 4px 0 0;
    font-size: 11pt;
    font-style: italic;
  }

  .rv-header__contacts {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px 16px;
    margin-top: 8px;
    font-size: 9.5pt;
  }

  .rv-header__contact {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
  }

  .rv-header__icon {
    flex-shrink: 0;
    color: #000000;
  }

  .rv-section {
    margin-top: 0.15in;
  }

  .rv-section__heading {
    margin: 0 0 4px;
    padding-bottom: 1px;
    border-bottom: 1px solid #000000;
    font-variant: small-caps;
    font-size: 13pt;
    font-weight: 400;
    letter-spacing: 0.03em;
    text-align: left;
  }

  .rv-section__body,
  .rv-skills-line {
    margin: 0;
  }

  .rv-skills-block {
    font-size: 11pt;
  }

  .rv-skills-label {
    font-weight: 600;
  }

  .rv-exp,
  .rv-edu {
    margin-bottom: 10px;
    break-inside: avoid;
  }

  .rv-exp__topline,
  .rv-exp__titleline {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 16px;
  }

  .rv-exp__company,
  .rv-edu__institution {
    font-size: 11pt;
    font-weight: 600;
  }

  .rv-exp__dates {
    flex-shrink: 0;
    font-size: 10pt;
    font-style: italic;
    text-align: right;
  }

  .rv-exp__title,
  .rv-edu__degree {
    font-size: 10.5pt;
    font-style: italic;
  }

  .rv-exp__location {
    flex-shrink: 0;
    font-size: 10pt;
    text-align: right;
  }

  .rv-bullets {
    margin: 4px 0 0;
    padding-left: 1em;
    line-height: 1.4;
    list-style: disc;
  }

  .rv-bullets li {
    margin-bottom: 3px;
  }
`
