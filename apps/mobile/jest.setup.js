// Mock AsyncStorage for all tests
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

// Mock PagerView (native component that won't render in Jest)
jest.mock('react-native-pager-view', () => {
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: View,
  };
});
