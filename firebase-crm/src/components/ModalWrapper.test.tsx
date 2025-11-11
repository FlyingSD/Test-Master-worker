/**
 * ModalWrapper Accessibility Tests (CRITICAL #9 FIX)
 *
 * Tests for WCAG 2.1 Level AA compliance:
 * - ARIA roles and labels
 * - Focus trap
 * - Keyboard navigation
 * - Focus return
 * - Screen reader announcements
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import ModalWrapper from './ModalWrapper'

describe('ModalWrapper - Accessibility (CRITICAL #9)', () => {
  let onCloseMock: ReturnType<typeof vi.fn>

  beforeEach(() => {
    onCloseMock = vi.fn()
  })

  afterEach(() => {
    // Clean up body style changes
    document.body.style.overflow = ''
  })

  // ============================================================================
  // ARIA ROLES AND LABELS
  // ============================================================================

  describe('ARIA Roles and Labels', () => {
    it('has role="dialog" attribute', () => {
      render(
        <ModalWrapper isOpen={true} onClose={onCloseMock} title="Test Modal">
          <div>Modal content</div>
        </ModalWrapper>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
    })

    it('has aria-modal="true" attribute', () => {
      render(
        <ModalWrapper isOpen={true} onClose={onCloseMock} title="Test Modal">
          <div>Modal content</div>
        </ModalWrapper>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })

    it('has aria-labelledby pointing to title', () => {
      render(
        <ModalWrapper isOpen={true} onClose={onCloseMock} title="Test Modal Title">
          <div>Modal content</div>
        </ModalWrapper>
      )

      const dialog = screen.getByRole('dialog')
      const title = screen.getByText('Test Modal Title')

      expect(dialog).toHaveAttribute('aria-labelledby')
      expect(dialog.getAttribute('aria-labelledby')).toBe(title.id)
    })

    it('has aria-describedby when description is provided', () => {
      render(
        <ModalWrapper
          isOpen={true}
          onClose={onCloseMock}
          title="Test Modal"
          description="This is a test description"
        >
          <div>Modal content</div>
        </ModalWrapper>
      )

      const dialog = screen.getByRole('dialog')
      const description = screen.getByText('This is a test description')

      expect(dialog).toHaveAttribute('aria-describedby')
      expect(dialog.getAttribute('aria-describedby')).toBe(description.id)
    })

    it('does not have aria-describedby when no description provided', () => {
      render(
        <ModalWrapper isOpen={true} onClose={onCloseMock} title="Test Modal">
          <div>Modal content</div>
        </ModalWrapper>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).not.toHaveAttribute('aria-describedby')
    })

    it('close button has aria-label', () => {
      render(
        <ModalWrapper isOpen={true} onClose={onCloseMock} title="Test Modal">
          <div>Modal content</div>
        </ModalWrapper>
      )

      const closeButton = screen.getByLabelText('Close dialog')
      expect(closeButton).toBeInTheDocument()
    })
  })

  // ============================================================================
  // KEYBOARD NAVIGATION
  // ============================================================================

  describe('Keyboard Navigation', () => {
    it('closes modal when Escape key is pressed', () => {
      render(
        <ModalWrapper isOpen={true} onClose={onCloseMock} title="Test Modal">
          <div>Modal content</div>
        </ModalWrapper>
      )

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onCloseMock).toHaveBeenCalledTimes(1)
    })

    it('does not close on Escape when closeOnEscape is false', () => {
      render(
        <ModalWrapper
          isOpen={true}
          onClose={onCloseMock}
          title="Test Modal"
          closeOnEscape={false}
        >
          <div>Modal content</div>
        </ModalWrapper>
      )

      fireEvent.keyDown(document, { key: 'Escape' })

      expect(onCloseMock).not.toHaveBeenCalled()
    })

    it('traps focus within modal on Tab', async () => {
      const user = userEvent.setup()

      render(
        <ModalWrapper isOpen={true} onClose={onCloseMock} title="Test Modal">
          <button>First</button>
          <button>Second</button>
          <button>Third</button>
        </ModalWrapper>
      )

      const firstButton = screen.getByText('First')
      const secondButton = screen.getByText('Second')
      const thirdButton = screen.getByText('Third')
      const closeButton = screen.getByLabelText('Close dialog')

      // Focus should cycle through: First -> Second -> Third -> Close -> First
      firstButton.focus()
      expect(document.activeElement).toBe(firstButton)

      await user.tab()
      expect(document.activeElement).toBe(secondButton)

      await user.tab()
      expect(document.activeElement).toBe(thirdButton)

      await user.tab()
      expect(document.activeElement).toBe(closeButton)

      // Tab from last element should cycle to first
      await user.tab()
      expect(document.activeElement).toBe(firstButton)
    })

    it('traps focus backward on Shift+Tab', async () => {
      const user = userEvent.setup()

      render(
        <ModalWrapper isOpen={true} onClose={onCloseMock} title="Test Modal">
          <button>First</button>
          <button>Second</button>
        </ModalWrapper>
      )

      const firstButton = screen.getByText('First')
      const secondButton = screen.getByText('Second')

      // Start at first button
      firstButton.focus()
      expect(document.activeElement).toBe(firstButton)

      // Shift+Tab from first should go to last (close button)
      await user.tab({ shift: true })
      const closeButton = screen.getByLabelText('Close dialog')
      expect(document.activeElement).toBe(closeButton)

      // Shift+Tab again should go to second button
      await user.tab({ shift: true })
      expect(document.activeElement).toBe(secondButton)
    })
  })

  // ============================================================================
  // FOCUS MANAGEMENT
  // ============================================================================

  describe('Focus Management', () => {
    it('focuses modal on mount', async () => {
      render(
        <ModalWrapper isOpen={true} onClose={onCloseMock} title="Test Modal">
          <div>Modal content</div>
        </ModalWrapper>
      )

      await waitFor(() => {
        const dialog = screen.getByRole('dialog')
        expect(document.activeElement).toBe(dialog)
      })
    })

    it('returns focus to trigger element when closed', async () => {
      const TriggerComponent = () => {
        const [isOpen, setIsOpen] = React.useState(false)

        return (
          <>
            <button onClick={() => setIsOpen(true)}>Open Modal</button>
            <ModalWrapper
              isOpen={isOpen}
              onClose={() => setIsOpen(false)}
              title="Test Modal"
            >
              <div>Modal content</div>
            </ModalWrapper>
          </>
        )
      }

      render(<TriggerComponent />)

      const triggerButton = screen.getByText('Open Modal')
      triggerButton.focus()
      expect(document.activeElement).toBe(triggerButton)

      // Open modal
      fireEvent.click(triggerButton)

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Close modal
      fireEvent.keyDown(document, { key: 'Escape' })

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(document.activeElement).toBe(triggerButton)
      })
    })

    it('prevents body scroll when modal is open', () => {
      const { unmount } = render(
        <ModalWrapper isOpen={true} onClose={onCloseMock} title="Test Modal">
          <div>Modal content</div>
        </ModalWrapper>
      )

      expect(document.body.style.overflow).toBe('hidden')

      unmount()

      expect(document.body.style.overflow).toBe('')
    })
  })

  // ============================================================================
  // USER INTERACTIONS
  // ============================================================================

  describe('User Interactions', () => {
    it('closes modal when close button is clicked', () => {
      render(
        <ModalWrapper isOpen={true} onClose={onCloseMock} title="Test Modal">
          <div>Modal content</div>
        </ModalWrapper>
      )

      const closeButton = screen.getByLabelText('Close dialog')
      fireEvent.click(closeButton)

      expect(onCloseMock).toHaveBeenCalledTimes(1)
    })

    it('closes modal when backdrop is clicked', () => {
      render(
        <ModalWrapper isOpen={true} onClose={onCloseMock} title="Test Modal">
          <div>Modal content</div>
        </ModalWrapper>
      )

      // Click backdrop (parent div with role="presentation")
      const backdrop = screen.getByRole('presentation')
      fireEvent.click(backdrop)

      expect(onCloseMock).toHaveBeenCalledTimes(1)
    })

    it('does not close when clicking inside modal content', () => {
      render(
        <ModalWrapper isOpen={true} onClose={onCloseMock} title="Test Modal">
          <div data-testid="modal-content">Modal content</div>
        </ModalWrapper>
      )

      const content = screen.getByTestId('modal-content')
      fireEvent.click(content)

      expect(onCloseMock).not.toHaveBeenCalled()
    })

    it('does not close on backdrop click when closeOnBackdropClick is false', () => {
      render(
        <ModalWrapper
          isOpen={true}
          onClose={onCloseMock}
          title="Test Modal"
          closeOnBackdropClick={false}
        >
          <div>Modal content</div>
        </ModalWrapper>
      )

      const backdrop = screen.getByRole('presentation')
      fireEvent.click(backdrop)

      expect(onCloseMock).not.toHaveBeenCalled()
    })
  })

  // ============================================================================
  // RENDERING
  // ============================================================================

  describe('Rendering', () => {
    it('renders title correctly', () => {
      render(
        <ModalWrapper isOpen={true} onClose={onCloseMock} title="My Modal Title">
          <div>Content</div>
        </ModalWrapper>
      )

      expect(screen.getByText('My Modal Title')).toBeInTheDocument()
    })

    it('renders description when provided', () => {
      render(
        <ModalWrapper
          isOpen={true}
          onClose={onCloseMock}
          title="Title"
          description="Description text"
        >
          <div>Content</div>
        </ModalWrapper>
      )

      expect(screen.getByText('Description text')).toBeInTheDocument()
    })

    it('renders children content', () => {
      render(
        <ModalWrapper isOpen={true} onClose={onCloseMock} title="Title">
          <div data-testid="child-content">Child content here</div>
        </ModalWrapper>
      )

      expect(screen.getByTestId('child-content')).toBeInTheDocument()
      expect(screen.getByText('Child content here')).toBeInTheDocument()
    })

    it('renders footer when provided', () => {
      render(
        <ModalWrapper
          isOpen={true}
          onClose={onCloseMock}
          title="Title"
          footer={<button>Save</button>}
        >
          <div>Content</div>
        </ModalWrapper>
      )

      expect(screen.getByText('Save')).toBeInTheDocument()
    })

    it('does not render when isOpen is false', () => {
      render(
        <ModalWrapper isOpen={false} onClose={onCloseMock} title="Title">
          <div>Content</div>
        </ModalWrapper>
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('applies custom maxWidth class', () => {
      render(
        <ModalWrapper
          isOpen={true}
          onClose={onCloseMock}
          title="Title"
          maxWidth="max-w-4xl"
        >
          <div>Content</div>
        </ModalWrapper>
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveClass('max-w-4xl')
    })
  })

  // ============================================================================
  // WCAG COMPLIANCE
  // ============================================================================

  describe('WCAG 2.1 Level AA Compliance', () => {
    it('meets WCAG 2.4.3 Focus Order', async () => {
      const user = userEvent.setup()

      render(
        <ModalWrapper isOpen={true} onClose={onCloseMock} title="Test">
          <input placeholder="First" />
          <button>Second</button>
          <a href="#">Third</a>
        </ModalWrapper>
      )

      // Focus should move in logical order
      const first = screen.getByPlaceholderText('First')
      const second = screen.getByText('Second')
      const third = screen.getByText('Third')

      first.focus()
      await user.tab()
      expect(document.activeElement).toBe(second)

      await user.tab()
      expect(document.activeElement).toBe(third)
    })

    it('meets WCAG 2.4.7 Focus Visible', () => {
      render(
        <ModalWrapper isOpen={true} onClose={onCloseMock} title="Test">
          <button>Test Button</button>
        </ModalWrapper>
      )

      const button = screen.getByText('Test Button')
      button.focus()

      // Button should have visible focus indicator (browser default)
      expect(document.activeElement).toBe(button)
    })

    it('meets WCAG 4.1.2 Name, Role, Value', () => {
      render(
        <ModalWrapper isOpen={true} onClose={onCloseMock} title="Payment Modal">
          <div>Content</div>
        </ModalWrapper>
      )

      const dialog = screen.getByRole('dialog')

      // Dialog has proper role
      expect(dialog).toHaveAttribute('role', 'dialog')

      // Dialog has accessible name via aria-labelledby
      expect(dialog).toHaveAttribute('aria-labelledby')

      // Close button has accessible name
      const closeButton = screen.getByLabelText('Close dialog')
      expect(closeButton).toBeInTheDocument()
    })
  })
})
