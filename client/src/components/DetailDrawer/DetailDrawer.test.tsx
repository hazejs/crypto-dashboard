import { fireEvent, render, screen } from '@testing-library/react';
import { DetailDrawer } from './DetailDrawer';

const drawer = (open: boolean) => (
  <table>
    <tbody>
      <DetailDrawer open={open} colSpan={2}>
        content
      </DetailDrawer>
    </tbody>
  </table>
);

describe('DetailDrawer', () => {
  it('renders nothing while closed', () => {
    render(drawer(false));
    expect(screen.queryByText('content')).toBeNull();
  });

  it('mounts its content when open', () => {
    render(drawer(true));
    screen.getByText('content');
  });

  it('unmounts only after the closing transition ends', () => {
    const { rerender, container } = render(drawer(true));
    rerender(drawer(false));
    screen.getByText('content'); // still mounted during the exit transition
    fireEvent.transitionEnd(container.querySelector('.drawer')!);
    expect(screen.queryByText('content')).toBeNull();
  });
});
