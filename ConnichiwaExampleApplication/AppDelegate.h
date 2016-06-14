//
//  AppDelegate.h
//  ConnichiwaExampleApplication
//
//  Created by Mario Schreiner on 07/01/15.
//  Copyright (c) 2015 Your Organization. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <Connichiwa/Connichiwa.h>

@interface AppDelegate : UIResponder <UIApplicationDelegate>

@property (strong, readonly) CWWebApplication *webApp;

@property (strong, nonatomic) UIWindow *window;


@end

