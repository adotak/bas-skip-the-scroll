import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { CardView } from '../components/CardView';
import { FIXTURE_SESSIONS } from '../fixtures/sessions';
import {
  getCardNote,
  getCardTakeaways,
  saveCardNote,
  toggleCardTakeaway,
} from '../store/storage';

jest.mock('../store/storage', () => ({
  getCardNote: jest.fn(),
  getCardTakeaways: jest.fn(),
  saveCardNote: jest.fn(),
  toggleCardTakeaway: jest.fn(),
}));

jest.mock('react-native-webview', () => ({
  WebView: () => null,
}));

describe('CardView', () => {
  beforeEach(() => {
    jest.mocked(getCardNote).mockResolvedValue('');
    jest.mocked(getCardTakeaways).mockResolvedValue([0, 2]);
    jest.mocked(saveCardNote).mockResolvedValue();
    jest.mocked(toggleCardTakeaway).mockResolvedValue([0, 2]);
  });

  test('reports previously checked takeaways after loading the card', async () => {
    const card = FIXTURE_SESSIONS[0].cards[0];
    const onTakeawayChange = jest.fn();

    render(<CardView card={card} onTakeawayChange={onTakeawayChange} />);

    await waitFor(() => {
      expect(getCardTakeaways).toHaveBeenCalledWith(card.id);
      expect(onTakeawayChange).toHaveBeenCalledWith(card.id, 2);
    });
  });
});
