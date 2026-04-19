import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CellInput from './CellInput';

// Helper: render CellInput inside a <table><tbody><tr> so <td> is valid HTML
function renderCell(props) {
  return render(
    <table>
      <tbody>
        <tr>
          <CellInput {...props} />
        </tr>
      </tbody>
    </table>
  );
}

// ─── Boolean variant ──────────────────────────────────────────────────────────

describe('CellInput — boolean type', () => {
  it('renders a button with role="checkbox"', () => {
    renderCell({ type: 'boolean', value: false, day: 1, onChange: vi.fn() });
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  it('sets aria-checked=false when value is false', () => {
    renderCell({ type: 'boolean', value: false, day: 1, onChange: vi.fn() });
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
  });

  it('sets aria-checked=true when value is true', () => {
    renderCell({ type: 'boolean', value: true, day: 1, onChange: vi.fn() });
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'true');
  });

  it('calls onChange with true when unchecked cell is clicked', async () => {
    const onChange = vi.fn();
    renderCell({ type: 'boolean', value: false, day: 1, onChange });
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange with false when checked cell is clicked', async () => {
    const onChange = vi.fn();
    renderCell({ type: 'boolean', value: true, day: 1, onChange });
    await userEvent.click(screen.getByRole('checkbox'));
    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('treats null/undefined value as unchecked', () => {
    renderCell({ type: 'boolean', value: null, day: 1, onChange: vi.fn() });
    expect(screen.getByRole('checkbox')).toHaveAttribute('aria-checked', 'false');
  });

  it('renders inside a <td> element', () => {
    const { container } = renderCell({ type: 'boolean', value: false, day: 1, onChange: vi.fn() });
    const td = container.querySelector('td');
    expect(td).toBeInTheDocument();
  });
});

// ─── Numeric variant ──────────────────────────────────────────────────────────

describe('CellInput — numeric type', () => {
  it('renders an input with type="number"', () => {
    renderCell({ type: 'numeric', value: 0, day: 1, onChange: vi.fn() });
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('displays the current numeric value', () => {
    renderCell({ type: 'numeric', value: 42, day: 1, onChange: vi.fn() });
    expect(screen.getByRole('spinbutton')).toHaveValue(42);
  });

  it('calls onChange with parsed number on blur', async () => {
    const onChange = vi.fn();
    renderCell({ type: 'numeric', value: null, day: 1, onChange });
    const input = screen.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '7');
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(7);
  });

  it('calls onChange with parsed float on blur', async () => {
    const onChange = vi.fn();
    renderCell({ type: 'numeric', value: null, day: 1, onChange });
    const input = screen.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '3.5');
    fireEvent.blur(input);
    expect(onChange).toHaveBeenCalledWith(3.5);
  });

  it('does NOT call onChange when input is empty on blur', async () => {
    const onChange = vi.fn();
    renderCell({ type: 'numeric', value: null, day: 1, onChange });
    const input = screen.getByRole('spinbutton');
    await userEvent.clear(input);
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('does NOT call onChange for non-numeric input on blur', async () => {
    const onChange = vi.fn();
    renderCell({ type: 'numeric', value: null, day: 1, onChange });
    const input = screen.getByRole('spinbutton');
    // Simulate typing non-numeric text by directly setting value
    fireEvent.change(input, { target: { value: 'abc' } });
    fireEvent.blur(input);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('calls onChange on Enter key press', async () => {
    const onChange = vi.fn();
    renderCell({ type: 'numeric', value: null, day: 1, onChange });
    const input = screen.getByRole('spinbutton');
    await userEvent.clear(input);
    await userEvent.type(input, '15');
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(15);
  });

  it('renders inside a <td> element', () => {
    const { container } = renderCell({ type: 'numeric', value: 5, day: 1, onChange: vi.fn() });
    const td = container.querySelector('td');
    expect(td).toBeInTheDocument();
  });

  it('shows abbreviated overlay for values >= 1000 when not focused', () => {
    renderCell({ type: 'numeric', value: 2500, day: 1, onChange: vi.fn() });
    // Input should not be visible; abbreviated text should be shown
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();
    expect(screen.getByText('3k')).toBeInTheDocument();
  });

  it('shows raw input when focused (not abbreviated overlay)', async () => {
    renderCell({ type: 'numeric', value: 1000, day: 1, onChange: vi.fn() });
    // Initially shows abbreviated overlay
    const overlay = screen.getByText('1k');
    // Click overlay to focus
    await userEvent.click(overlay);
    // Now the input should be visible
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
  });

  it('does not show abbreviated overlay for values < 1000', () => {
    renderCell({ type: 'numeric', value: 999, day: 1, onChange: vi.fn() });
    expect(screen.getByRole('spinbutton')).toBeInTheDocument();
    expect(screen.queryByText(/k$/)).not.toBeInTheDocument();
  });
});
