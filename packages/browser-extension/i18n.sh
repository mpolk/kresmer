#!/bin/sh
# This script is used to generate the i18n files for the browser extension.

for lang in $(ls _locales); do
  echo "Generating i18n files for \"$lang\"..."
  YAML=locales/$lang/messages.yaml
  JSON_DIR=_locales/$lang
  JSON=$JSON_DIR/messages.json
  mkdir -p $JSON_DIR
  echo "  $YAML => $JSON"
  yq  '.' $YAML > $JSON
done
