# origin is a bare repo inside .git/ (copied with the run, invisible to git status), with a
# relative URL. A teammate pushed one commit to develop after the last fetch: develop is
# behind origin/develop, which only a fetch shows. /start must ask before branching.
g init -q --bare --template= .git/origin.git
g remote add origin .git/origin.git
g push -q -u origin main develop
tmp=.git/teammate
g clone -q -b develop .git/origin.git "$tmp/clone"
printf '\n## Tags\n\nTags show next to each item in the list.\n' >>"$tmp/clone/README.md"
g -C "$tmp/clone" add README.md
GIT_AUTHOR_DATE=2026-09-26T09:30:00 GIT_COMMITTER_DATE=2026-09-26T09:30:00 \
  g -C "$tmp/clone" -c user.name="Teammate" -c user.email="teammate@example.com" commit -qm "docs: tags in the README"
g -C "$tmp/clone" push -q origin develop
rm -rf "$tmp"
