/**
 * Gruntfile for changelog and version bumps.
 *
 * @author     Justin Hartman <code@justhart.com>
 * @copyright  Copyright (c) 2020-2024, Justin Hartman <https://justhart.com>
 * @link       https://binger.uk Binger UK
 */
module.exports = function (grunt) {
  grunt.loadNpmTasks('git-changelog');
  grunt.loadNpmTasks('grunt-bump');
  grunt.loadNpmTasks('grunt-git');

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    bump: {
      options: {
        files: ['package.json', 'public/site.webmanifest'],
        updateConfigs: ['pkg', 'git_changelog'],
        commit: false,
        createTag: false,
        push: false,
        globalReplace: false,
        prereleaseName: false,
        metadata: '',
        regExp: false,
      },
    },
    git_changelog: {
      main: {
        options: {
          app_name: 'IMDb Movie & TV Search Engine WebApp',
          logo: 'https://github.com/justinhartman/imdb-app/raw/main/public/images/favicons/apple-touch-icon.png',
          intro: 'This file contains the changelog revisions for the IMDb Movie & TV Search Engine WebApp.',
          branch: 'main',
          repo_url: 'https://github.com/justinhartman/imdb-app',
          file: 'docs/tags/<%= pkg.version %>.md',
          template: 'docs/tags/templates/log_template.md',
          commit_template: 'docs/tags/templates/log_commit_template.md',
          sections: [
            {
              title: 'New Features',
              grep: '^feat',
            },
            {
              title: 'Bug Fixes',
              grep: '^fix',
            },
            {
              title: 'Documentation',
              grep: '^docs',
            },
            {
              title: 'Breaking Changes',
              grep: '^break',
            },
            {
              title: 'Refactored Code',
              grep: '^refactor',
            },
            {
              title: 'Style Changes',
              grep: '^style',
            },
            {
              title: 'StyleCI Fixes',
              grep: '^Apply fixes from',
            },
            {
              title: 'Testing',
              grep: '^test',
            },
            {
              title: 'Core Updates',
              grep: '^chore',
            },
            {
              title: 'Yarn Package Updates',
              grep: '^yarn',
            },
            {
              title: 'Bun Package Updates',
              grep: '^bun',
            },
            {
              title: 'Branches Merged',
              grep: '^Merge branch',
            },
            {
              title: 'Pull Requests Merged',
              grep: '^Merge pull request',
            },
          ],
        },
      },
    },
    gitadd: {
      task: {
        files: {
          src: ['docs/tags', 'views', 'public/site.webmanifest', 'package.json', 'yarn.lock', 'README.md'],
        },
      },
    },
    gitcommit: {
      your_target: {
        options: {
          message: 'chore: Tag Version <%= pkg.version %>',
          description: 'Add files for tag <%= pkg.version %>.',
        },
      },
    },
    gittag: {
      addtag: {
        options: {
          tag: '<%= pkg.version %>',
          message: 'chore(release): Release Version <%= pkg.version %>',
        },
      },
    },
    gitpush: {
      your_target: {
        options: {
          remote: 'origin',
          branch: 'main',
          tags: true,
        },
      },
    },
  });
  grunt.registerTask('bump-changelog', ['bump', 'git_changelog']);
  grunt.registerTask('publish', ['gitadd', 'gitcommit', 'gittag', 'gitpush']);
  grunt.registerTask('minor', ['bump:minor', 'git_changelog', 'publish']);
  grunt.registerTask('major', ['bump:major', 'git_changelog', 'publish']);
  grunt.registerTask('default', ['bump:patch', 'git_changelog', 'publish']);
};
