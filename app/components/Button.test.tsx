import { render, screen, fireEvent, cleanup } from '@/lib/test-utils';
import Button from './Button';

// Clean up after each test
afterEach(cleanup);

describe('Button Component', () => {
  it('renders with provided text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with primary variant by default', () => {
    render(<Button>Primary Button</Button>);
    const button = screen.getByText('Primary Button');
    expect(button.className).toContain('bg-blue-600');
    expect(button.className).not.toContain('bg-gray-200');
  });

  it('renders with secondary variant when specified', () => {
    render(<Button variant="secondary">Secondary Button</Button>);
    const button = screen.getByText('Secondary Button');
    expect(button.className).toContain('bg-gray-200');
    expect(button.className).not.toContain('bg-blue-600');
  });
});