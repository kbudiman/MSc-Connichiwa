//
//  ViewController.m
//  ConnichiwaExampleApplication
//
//  Created by Mario Schreiner on 07/01/15.
//  Copyright (c) 2015 Your Organization. All rights reserved.
//

#import "ViewController.h"
#import "AppDelegate.h"


@interface ViewController ()

@end

@implementation ViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
    
    NSString *documentRoot = [[NSBundle mainBundle] bundlePath];
    documentRoot = [documentRoot stringByAppendingPathComponent:@"/www"];
    
    CWWebApplication *webApp = [appDelegate webApp];
    [webApp setRemoteWebView:self.remoteWebView];
    [webApp setDeviceName:[[UIDevice currentDevice] name]];
    [webApp launchWithDocumentRoot:documentRoot onWebview:self.webView];
    
    // Do any additional setup after loading the view, typically from a nib.
}

- (BOOL)prefersStatusBarHidden {
    return YES;
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

@end
