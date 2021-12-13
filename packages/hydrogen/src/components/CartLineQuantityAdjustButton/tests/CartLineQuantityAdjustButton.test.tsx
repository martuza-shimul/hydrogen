import React from 'react';
import {CartLineProvider} from '../../CartLineProvider';
import {CartLineQuantity} from '../../CartLineQuantity';
import {CartLineQuantityAdjustButton} from '../CartLineQuantityAdjustButton';
import {CART_LINE} from '../../CartLineProvider/tests/fixtures';
import {CartProvider, useCart} from '../../CartProvider';
import {CartContext} from '../../CartProvider/context';
import {CART} from '../../CartProvider/tests/fixtures';
import {mountWithShopifyProvider} from '../../../utilities/tests/shopify_provider';

describe('CartLineQuantityAdjustButton', () => {
  it('increases quantity', () => {
    const linesUpdateMock = jest.fn();
    const wrapper = mountWithShopifyProvider(
      <CartContextProvider passthroughProp={{linesUpdate: linesUpdateMock}}>
        <Cart>
          <CartLineQuantityAdjustButton adjust="increase">
            Increase
          </CartLineQuantityAdjustButton>
        </Cart>
      </CartContextProvider>
    );

    expect(wrapper).toContainReactComponent('span', {
      children: CART_LINE.quantity,
    });

    wrapper.find('button')!.trigger('onClick');

    expect(linesUpdateMock).toHaveBeenCalledWith([
      {
        id: CART_LINE.id,
        quantity: 2,
      },
    ]);
  });

  it.skip('decreases quantity', () => {
    const cart = {
      ...CART,
      lines: {
        edges: [
          {
            node: {
              ...CART_LINE,
              quantity: 2,
            },
          },
        ],
      },
    };

    const wrapper = mountWithShopifyProvider(
      <CartProvider cart={cart}>
        <Cart>
          <CartLineQuantityAdjustButton adjust="decrease">
            Decrease
          </CartLineQuantityAdjustButton>
        </Cart>
      </CartProvider>
    );

    expect(wrapper).toContainReactComponent('span', {
      children: 2,
    });

    mockCartFetch(
      cartDataWithLineOverrides({
        quantity: 1,
      })
    );

    wrapper.find('button')!.trigger('onClick');

    expect(fetch).toHaveBeenCalled();
    // @ts-ignore
    const init = fetch.mock.calls[0][1];
    const body = JSON.parse(init.body);

    expect(body.query).toContain('mutation CartLineUpdate');
    expect(body.variables.cartId).toBe(CART.id);
    expect(body.variables.lines[0]).toEqual({id: CART_LINE.id, quantity: 1});

    expect(wrapper).toContainReactComponent('span', {
      children: 1,
    });
  });
});

function CartContextProvider({
  children,
  passthroughProp = {},
}: {
  children: any;
  passthroughProp?: object;
}) {
  const cartContextValueMock = {
    status: 'idle' as const,
    ...CART,
    lines: [CART_LINE],
    ...passthroughProp,
  };
  return (
    // @ts-expect-error We aren't passing though all the necessary props here which triggers TS errors. However, we do allow the tests to pass through the props that they need to watch in passthroughProps prop
    <CartContext.Provider value={cartContextValueMock}>
      {children}
    </CartContext.Provider>
  );
}

function Cart({children}: {children: any}) {
  const {lines} = useCart();

  return (
    <ul>
      {lines.map((line) => (
        <li key={line.id}>
          <CartLineProvider line={line}>
            <CartLineQuantity />
            {children}
          </CartLineProvider>
        </li>
      ))}
    </ul>
  );
}

function mockCartFetch(cartResponseData: object) {
  // @ts-ignore
  global.fetch = jest.fn(async (_url, _init) => {
    return {
      json: async () =>
        JSON.stringify({
          data: {
            cart: cartResponseData,
          },
        }),
    };
  });
}

function cartDataWithLineOverrides(lineOverrides = {}) {
  return {
    ...CART,
    lines: {
      edges: [
        {
          node: {
            ...CART_LINE,
            ...lineOverrides,
          },
        },
      ],
    },
  };
}
