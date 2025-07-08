import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Input } from '@/components/ui/input'

describe('Input Component', () => {
  it('renders with correct attributes', () => {
    render(<Input type="text" placeholder="Enter text" />)

    const input = screen.getByPlaceholderText('Enter text')
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'text')
  })

  it('handles text input correctly', async () => {
    const user = userEvent.setup()
    const handleChange = jest.fn()

    render(<Input onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'Hello World')

    expect(input).toHaveValue('Hello World')
    expect(handleChange).toHaveBeenCalledTimes(11) // One for each character
  })

  it('supports different input types', () => {
    const { rerender } = render(<Input type="email" />)
    expect(screen.getByRole('textbox')).toHaveAttribute('type', 'email')

    rerender(<Input type="password" />)
    expect(screen.getByDisplayValue('')).toHaveAttribute('type', 'password')

    rerender(<Input type="number" />)
    expect(screen.getByRole('spinbutton')).toHaveAttribute('type', 'number')
  })

  it('can be disabled', () => {
    render(<Input disabled />)

    const input = screen.getByRole('textbox')
    expect(input).toBeDisabled()
    expect(input).toHaveClass('disabled:cursor-not-allowed')
  })

  it('applies custom className', () => {
    render(<Input className="custom-input" />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveClass('custom-input')
    expect(input).toHaveClass('flex') // Default class should still be there
  })

  it('forwards refs correctly', () => {
    const ref = jest.fn()
    render(<Input ref={ref} />)

    expect(ref).toHaveBeenCalledWith(expect.any(HTMLInputElement))
  })

  it('spreads additional props', () => {
    render(
      <Input
        data-testid="custom-input"
        aria-label="Custom input"
        maxLength={10}
      />
    )

    const input = screen.getByTestId('custom-input')
    expect(input).toHaveAttribute('aria-label', 'Custom input')
    expect(input).toHaveAttribute('maxLength', '10')
  })

  it('handles focus and blur events', async () => {
    const user = userEvent.setup()
    const handleFocus = jest.fn()
    const handleBlur = jest.fn()

    render(<Input onFocus={handleFocus} onBlur={handleBlur} />)

    const input = screen.getByRole('textbox')

    await user.click(input)
    expect(handleFocus).toHaveBeenCalledTimes(1)

    await user.tab()
    expect(handleBlur).toHaveBeenCalledTimes(1)
  })

  it('supports controlled input', async () => {
    const user = userEvent.setup()
    let value = ''
    const handleChange = jest.fn((e) => {
      value = e.target.value
    })

    const { rerender } = render(<Input value={value} onChange={handleChange} />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('')

    await user.type(input, 'test')

    // Simulate parent component updating the value
    rerender(<Input value="test" onChange={handleChange} />)
    expect(input).toHaveValue('test')
  })

  it('supports uncontrolled input with defaultValue', () => {
    render(<Input defaultValue="initial value" />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveValue('initial value')
  })

  it('handles keyboard events', async () => {
    const user = userEvent.setup()
    const handleKeyDown = jest.fn()
    const handleKeyUp = jest.fn()

    render(<Input onKeyDown={handleKeyDown} onKeyUp={handleKeyUp} />)

    const input = screen.getByRole('textbox')
    await user.type(input, 'a')

    expect(handleKeyDown).toHaveBeenCalled()
    expect(handleKeyUp).toHaveBeenCalled()
  })

  it('supports required attribute', () => {
    render(<Input required />)

    const input = screen.getByRole('textbox')
    expect(input).toBeRequired()
  })

  it('supports readonly attribute', () => {
    render(<Input readOnly value="readonly text" />)

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('readonly')
    expect(input).toHaveValue('readonly text')
  })

  it('handles form validation attributes', () => {
    render(
      <Input
        type="email"
        pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$"
        title="Please enter a valid email address"
      />
    )

    const input = screen.getByRole('textbox')
    expect(input).toHaveAttribute('pattern', '[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$')
    expect(input).toHaveAttribute('title', 'Please enter a valid email address')
  })

  it('maintains focus styles', async () => {
    const user = userEvent.setup()
    render(<Input />)

    const input = screen.getByRole('textbox')
    await user.click(input)

    expect(input).toHaveFocus()
    expect(input).toHaveClass('focus-visible:ring-2')
  })

  it('handles paste events', async () => {
    const user = userEvent.setup()
    const handlePaste = jest.fn()

    render(<Input onPaste={handlePaste} />)

    const input = screen.getByRole('textbox')
    await user.click(input)
    await user.paste('pasted text')

    expect(handlePaste).toHaveBeenCalled()
    expect(input).toHaveValue('pasted text')
  })
})
