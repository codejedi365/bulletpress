module.exports = {
    branches: [ "production", "next" ],
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
        "@semantic-release/release-notes-generator",
        [
            "semantic-release-plugin-update-version-in-files", {
                files: [
                    "public/index.html"
                ],
                placeholder: "0.0.0-dev"
            }
        ],
        "@semantic-release/github",
    ]
};
