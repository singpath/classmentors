# Release

The release package are upload by Travis each time a tag is pushed to
[singpath/classmentors].


## Pushing new release

Bump the `package.json` version number, commit it, create a new tag and push
new commit and the new tag.

You can let `npm version major|minor|patch` or `./tools/bin/release.sh` do it
for you. For example, to push a new "patch" version (if the current verion is
0.0.0, the new will be 0.0.1)
```bash
./tools/bin/release.sh patch
```

Or:
```bash
export NEW_VERSION=$(npm version patch)
git push origin master $NEW_VERSION
```


## Travis configuration

Travis uses encrypted Github API token to upload the package.

To reset it, delete the the oauth token named "automatic releases for singpath/classmentors"
on your [Github setting page](https://github.com/settings/tokens).

Then run:
```
npm run travis-setup
```

[singpath/classmentors]: https://github.com/singpath/classmentors
