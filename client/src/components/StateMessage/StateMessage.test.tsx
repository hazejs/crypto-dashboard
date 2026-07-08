import { render, screen } from '@testing-library/react';
import { StateMessage } from './StateMessage';

describe('StateMessage', () => {
  it('renders children as a plain state', () => {
    render(<StateMessage>Loading…</StateMessage>);
    expect(screen.getByText('Loading…').className).toBe('state');
  });

  it('adds the error class', () => {
    render(<StateMessage error>Boom</StateMessage>);
    expect(screen.getByText('Boom').className).toBe('state error');
  });
});
