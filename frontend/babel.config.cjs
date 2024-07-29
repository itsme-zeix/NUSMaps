module.exports = function (api) {
  api.cache(true);
  const isTest = api.env('test');
  const presets = ["babel-preset-expo", '@babel/preset-typescript'];
  const plugins = [];
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