module.exports = {
    apps: [
        {
            name: 'aviator', 
            script: './core.js',
            // disable_logs - если задать true, то логи вестись не будут; 
            watch: ['core.js'], 
            ignore_watch: ['node_modules'],  
            watch_delay: 1000   
        }
    ] 
}
