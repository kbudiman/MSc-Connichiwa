//
//  AppDelegate.m
//  ConnichiwaExampleApplication
//
//  Created by Mario Schreiner on 07/01/15.
//  Copyright (c) 2015 Your Organization. All rights reserved.
//

#import "AppDelegate.h"


static int LOG_LEVEL = 1;


@interface AppDelegate ()

@property (strong, readwrite) CWWebApplication *webApp;

@end



@implementation AppDelegate


- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    [CWWebApplication setLogLevel:LOG_LEVEL];
    
    self.webApp = [[CWWebApplication alloc] init];
    
    // Override point for customization after application launch.
    return YES;
}

- (void)applicationWillResignActive:(UIApplication *)application
{
    // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
    // Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
    
    [self.webApp applicationWillResignActive];
}


- (void)applicationDidEnterBackground:(UIApplication *)application
{
    // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
    // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    
    [self.webApp applicationDidEnterBackground];
}


- (void)applicationWillEnterForeground:(UIApplication *)application
{
    // Called as part of the transition from the background to the inactive state; here you can undo many of the changes made on entering the background.
    
    [self.webApp applicationWillEnterForeground];
}


- (void)applicationDidBecomeActive:(UIApplication *)application
{
    // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    
    [self.webApp applicationDidBecomeActive];
}


- (void)applicationWillTerminate:(UIApplication *)application
{
    // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    
    [self.webApp applicationWillTerminate];
}

@end
