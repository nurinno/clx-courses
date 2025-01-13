module.exports = {
  rules: {
    'property-no-vendor-prefix': null,
    'property-no-unknown': [
      true,
      {
        ignoreProperties: ['-webkit-appearance']
      }
    ]
  }
} 