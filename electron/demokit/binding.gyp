{
  "targets": [
    {
      "target_name": "mouse",
      "sources": [ "mouse.mm" ],
      "include_dirs": [
        "<!(node -e \"require('nan')\")"
      ],
        "conditions": [
        ['OS=="mac"', {
          "link_settings": {
            "libraries": [
              "Foundation.framework",
              "AppKit.framework",
            ]
          },
          "xcode_settings": {
            "MACOSX_DEPLOYMENT_TARGET": "10.8"
          },
        }]
      ]
    }
  ]
}
