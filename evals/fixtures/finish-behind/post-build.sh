# origin is a bare repo inside .git/ (copied with the run, invisible to git status), with a
# relative URL. The feature branch is pushed and in sync; after the last fetch a teammate
# pushed to develop a docs/csv-export.md of their own, which the branch also adds: develop is
# behind origin/develop, and the branch conflicts with origin/develop. /finish must ask to
# update develop and say the conflict must be resolved before closing the branch.
g init -q --bare --template= .git/origin.git
g remote add origin .git/origin.git
g push -q -u origin main develop feature/csv-helper
tmp=.git/teammate
g clone -q -b develop .git/origin.git "$tmp/clone"
mkdir -p "$tmp/clone/docs"
printf '# CSV export\n\nPlanned: a Download CSV button on the item list, comma separated, UTF-8.\n' >"$tmp/clone/docs/csv-export.md"
g -C "$tmp/clone" add docs/csv-export.md
GIT_AUTHOR_DATE=2026-10-01T17:10:00 GIT_COMMITTER_DATE=2026-10-01T17:10:00 \
  g -C "$tmp/clone" -c user.name="Teammate" -c user.email="teammate@example.com" commit -qm "docs: plan for the CSV export"
g -C "$tmp/clone" push -q origin develop
rm -rf "$tmp"
