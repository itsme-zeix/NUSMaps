module.exports = function (api) {
  api.cache(() => process.env.NODE_ENV === 'production');
  const presets = ["babel-preset-expo", '@babel/preset-typescript'];
  const plugins = [];
  // Check the environment and conditionally add plugins
  const isTest = process.env.NODE_ENV === 'test';
  if (isTest) {
    plugins.push(
      ['@babel/plugin-transform-class-properties', { loose: true }],
      ['@babel/plugin-transform-private-methods', { loose: true }],
      ['@babel/plugin-transform-private-property-in-object', { loose: true }],
      ["react-native-reanimated/plugin"]
    );
  }
  return {
    presets,
    plugins, 
  };
};