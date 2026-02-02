import React from 'react'
import { render, screen } from '@testing-library/react'
import { MainContentContainer } from '../MainContentContainer'

describe('MainContentContainer', () => {
  it('renders children correctly', () => {
    render(
      <MainContentContainer>
        <div data-testid="test-content">Test Content</div>
      </MainContentContainer>
    )

    expect(screen.getByTestId('test-content')).toBeInTheDocument()
    expect(screen.getByTestId('test-content')).toHaveTextContent('Test Content')
  })

  it('applies default max-width and padding classes', () => {
    const { container } = render(
      <MainContentContainer>
        <div>Test</div>
      </MainContentContainer>
    )

    const mainContainer = container.firstChild as HTMLElement
    expect(mainContainer).toHaveClass('container', 'mx-auto', 'max-w-7xl', 'px-12', 'py-12')
  })

  it('applies custom max-width when provided', () => {
    const { container } = render(
      <MainContentContainer maxWidth="6xl">
        <div>Test</div>
      </MainContentContainer>
    )

    const mainContainer = container.firstChild as HTMLElement
    expect(mainContainer).toHaveClass('max-w-6xl')
    expect(mainContainer).not.toHaveClass('max-w-7xl')
  })

  it('applies custom padding when provided', () => {
    const { container } = render(
      <MainContentContainer padding="md">
        <div>Test</div>
      </MainContentContainer>
    )

    const mainContainer = container.firstChild as HTMLElement
    expect(mainContainer).toHaveClass('px-6', 'py-6')
    expect(mainContainer).not.toHaveClass('px-12', 'py-12')
  })

  it('applies custom className when provided', () => {
    const { container } = render(
      <MainContentContainer className="custom-class">
        <div>Test</div>
      </MainContentContainer>
    )

    const mainContainer = container.firstChild as HTMLElement
    expect(mainContainer).toHaveClass('custom-class')
  })

  it('includes responsive classes for mobile', () => {
    const { container } = render(
      <MainContentContainer>
        <div>Test</div>
      </MainContentContainer>
    )

    const mainContainer = container.firstChild as HTMLElement
    expect(mainContainer).toHaveClass('max-lg:px-6', 'max-lg:py-6')
  })
})
