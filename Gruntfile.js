module.exports = function(grunt) {
  // Project configuration.
  grunt.initConfig({
	// Récupère le site ringover
	gitclone: {
		ringover: {	
			options: {
				repository: 'ssh://git@gitlab.monadminbjt.fr:31141/RingOver/www-myringover-com.git',
				branch: 'electron',
				directory: './app/app/'
			}			
		}
	},
	// "github-release": {
	// 	// Créer une nouvelle release sur github pour win32
	// 	win32: {
	// 		options: {
	// 		  repository: 'aureleoules/ringover-desktop', // Path to repository
	// 		  auth: {
	// 			user: 'aureleoules',
	// 			password: ''
	// 		  }
	// 		},
	// 		release: {
	// 			body: 'Desktop app for ringover',
	// 			draft: false, 
	// 			prerelease: false
	// 		},
	// 		files: {
	// 		  src: grunt.file.expand(['./build/ia32/RELEASES', './build/ia32/*.zip', './build/ia32/*' + grunt.file.readJSON('package.json').version + '*.nupkg']) // Files that you want to attach to Release
	// 		}
	// 	}
	// },
	'create-windows-installer': {
		// Construit une nouvelle version de l'exécutable pour win32
		ia32: {
			appDirectory: './release/win-unpacked/',
			outputDirectory: './build/ia32',
			// certificateFile: 'windows.crt',
			authors: 'Ringover Group',
			exe: 'ringover.exe',
			description: "Ringover desktop application",
			// setupIcon: "./assets/win/ringover.ico",
			//remoteReleases: "http://176.31.109.76:6002/update/win32/latest"
		}
	},
	compress: {
		// Compression de l'installeur win32 afin de le mettre sur github
		win32: {
			options: {
			  archive: './build/ia32/ringover-installer-win32.zip',
			  mode: 'zip'
			},
			files: [
				{
					cwd: 'build/ia32/', 
					expand: true, 
					src: './Setup.exe'
				}
			]			
		}
	}
  });

  grunt.loadNpmTasks('grunt-electron-installer')
  grunt.loadNpmTasks('grunt-git');
  grunt.loadNpmTasks('grunt-github-releaser');
  grunt.loadNpmTasks('grunt-contrib-compress');
	
  // Default task(s).
  grunt.registerTask('default', ['create-windows-installer']);
  grunt.registerTask('ringover-git-clone', 'gitclone:ringover');
  grunt.registerTask('ringover-win32-release', ['compress:win32', 'github-release:win32']);
};
