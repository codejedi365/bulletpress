let angularWriterOpts = null;
Promise.all([require("conventional-changelog-angular/writer-opts")]).then((module) => {
    // Must resolve the Promises of module.exports in conventional-changelog-angular@5.0.13
    angularWriterOpts = module.pop();
});

module.exports = {
    branches: [ "master" ],
    plugins: [
        [
            "@semantic-release/commit-analyzer",
            {
                preset: "angular",
                releaseRules: [
                    { type: "build", scope: "deps", release: "patch" },
                    { type: "build", scope: "deps-peer", release: "patch" },
                    { type: "build", scope: "deps-dev", release: false },
                    { type: "docs", scope: "README", release: "patch" },
                    { type: "docs", scope: "LICENSE", release: "patch" }
                    // Continue matching via commit-analyzer/lib/default-release-rules.js
                    // which are the following for the angular preset:
                    // { breaking: true, release: 'major' },
                    // { revert: true, release: 'patch' },
                    // { type: 'feat', release: 'minor' },
                    // { type: 'fix', release: 'patch' },
                    // { type: 'perf', release: 'patch' },
                ]
            }
        ],
        [
            "@semantic-release/release-notes-generator", {
                preset: "angular",
                writerOpts: {
                    transform: (commit, context) => {
                        // Modify transform to include non-breaking Documentation / Build changes in Changelog
                        // This wrapper was based the implementation of conventional-changelog-angular@5.0.13
                        const initCommitTransform = angularWriterOpts.transform(commit, context)
                        if (initCommitTransform) return initCommitTransform
                        // Determine if commit should be in the changelog, logic should match releaseRules above!
                        if (!/^(build|docs)$/.test(commit.type)) return
                        if (commit.type === "build" && !/^deps(-peer)?$/.test(commit.scope)) return
                        if (commit.type === "docs" && !/^(README|LICENSE)$/i.test(commit.scope)) return
                        // Trigger internal flag 'discard' to be false as it thinks
                        // there is a Breaking Change in this commit
                        commit.notes.push({})
                        // Re-run the original transform
                        const transformedCommit = angularWriterOpts.transform(commit, context)
                        transformedCommit.notes.pop() // Reset
                        // return transformed commit instead of None
                        return transformedCommit
                    }
                }
            }
        ],
        [
            "semantic-release-plugin-update-version-in-files", {
                files: [
                    "public/index.html",
                    "package.json"
                ],
                placeholder: "0.0.0-semantically-versioned"
            }
        ],
        [
            "@semantic-release/exec", {
                prepareCmd: "/bin/bash ./scripts/prepare-release.sh"
            }
        ],
        [
            "@semantic-release/github", {
                assets: [
                    { label: "Bulletpress App [offline-pkg]", path: "bulletpress-*.tgz" },
                    { label: "Checksums [SHA-256]", path: "checksums.txt" },
                    { label: "Checksums Signature [GPG]", path: "checksums.txt.gpg" }
                ]
            }
        ]
    ]
};
