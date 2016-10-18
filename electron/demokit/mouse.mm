#include <nan.h>
#import <AppKit/AppKit.h>

using namespace v8;

NSCursor * platformCursorForCSSCursor(const char * aName);
NSString * bestDataURL(NSImage * image);
NSBitmapImageRep * toBitmapImageRepresentation(NSImage * image);

void GetCursor(const Nan::FunctionCallbackInfo<v8::Value>& info)
{
    @autoreleasepool
    {
        if (info.Length() < 1)
        {
            Nan::ThrowTypeError("Wrong number of arguments");
            return;
        }
    
        if (!info[0]->IsString())
        {
            Nan::ThrowTypeError("Argument 0 must be a string.");
            return;
        }
    
        const char * name = *Nan::Utf8String(info[0]->ToString());
        NSCursor * cursor = platformCursorForCSSCursor(name);
        NSImage * image = cursor.image;

        v8::Local<v8::Object> cursorObject = Nan::New<v8::Object>();
        
        NSBitmapImageRep * imageRepresentation = toBitmapImageRepresentation(image);
        NSData * PNGImageData = [imageRepresentation representationUsingType:NSPNGFileType properties:[NSDictionary dictionary]];
        NSString * base64 = [PNGImageData base64EncodedStringWithOptions:0];
        NSString * imageURL = [@"data:image/png;base64," stringByAppendingString:base64];

        cursorObject->Set(Nan::New("imageURL").ToLocalChecked(), Nan::New(imageURL.UTF8String).ToLocalChecked());

        v8::Local<v8::Object> hotSpot = Nan::New<v8::Object>();
        
        hotSpot->Set(Nan::New("x").ToLocalChecked(), Nan::New(cursor.hotSpot.x));
        hotSpot->Set(Nan::New("y").ToLocalChecked(), Nan::New(cursor.hotSpot.y));
        
        cursorObject->Set(Nan::New("hotSpot").ToLocalChecked(), hotSpot);
        
        NSSize imageSize = cursor.image.size;
        v8::Local<v8::Object> size = Nan::New<v8::Object>();

        size->Set(Nan::New("width").ToLocalChecked(), Nan::New(imageSize.width));
        size->Set(Nan::New("height").ToLocalChecked(), Nan::New(imageSize.height));
        
        cursorObject->Set(Nan::New("size").ToLocalChecked(), size);

        info.GetReturnValue().Set(cursorObject);
    }
}

NSBitmapImageRep * toBitmapImageRepresentation(NSImage * image)
{
    int width = image.size.width;
    int height = image.size.height;

    if (width < 1 || height < 1)
        return nil;

    NSBitmapImageRep * representation = [[NSBitmapImageRep alloc]
                                           initWithBitmapDataPlanes: NULL
                                           pixelsWide: width
                                           pixelsHigh: height
                                           bitsPerSample: 8
                                           samplesPerPixel: 4
                                           hasAlpha: YES
                                           isPlanar: NO
                                           colorSpaceName: NSDeviceRGBColorSpace
                                           bytesPerRow: width * 4
                                           bitsPerPixel: 32];

    NSGraphicsContext *ctx = [NSGraphicsContext graphicsContextWithBitmapImageRep: representation];
    [NSGraphicsContext saveGraphicsState];
    [NSGraphicsContext setCurrentContext: ctx];  
    [image drawAtPoint: NSZeroPoint fromRect: NSZeroRect operation: NSCompositeCopy fraction: 1.0];
    [ctx flushGraphics];
    [NSGraphicsContext restoreGraphicsState];

    return [representation autorelease];
}

NSCursor * platformCursorForCSSCursor(const char * aName)
{
    if (strncmp("default", aName, 7) == 0)
        return [NSCursor arrowCursor];

    return nil;
}

void PerformClick(const Nan::FunctionCallbackInfo<v8::Value>& info)
{
    @autoreleasepool
    {
        if (info.Length() < 2)
        {
            Nan::ThrowTypeError("Wrong number of arguments");
            return;
        }
        
        int x = info[0]->ToNumber()->Int32Value();
        int y = info[1]->ToNumber()->Int32Value();
        
        NSWindow * window = [NSApp windows][0];
        int windowNumber = window.windowNumber;
        NSView * contentView = window.contentView;
        NSPoint contentPoint = NSMakePoint(x, NSHeight(contentView.frame) - y);
        NSPoint windowPoint = [contentView convertPoint:contentPoint toView:nil];
        NSEvent * mouseDown = [NSEvent mouseEventWithType:NSLeftMouseDown
                       location:windowPoint
                  modifierFlags:0
                      timestamp:[[NSDate date] timeIntervalSince1970] 
                   windowNumber:windowNumber
                        context:nil
                    eventNumber:0
                     clickCount:1
                       pressure:0];

        [NSApp sendEvent:mouseDown];
    
        NSEvent * mouseUp = [NSEvent mouseEventWithType:NSLeftMouseUp
                       location:windowPoint
                  modifierFlags:0
                      timestamp:[[NSDate date] timeIntervalSince1970] 
                   windowNumber:windowNumber
                        context:nil
                    eventNumber:0
                     clickCount:1
                       pressure:0];
                       
        [NSApp sendEvent:mouseUp];
    }
}

void Init(v8::Local<v8::Object> exports) {
  exports->Set(Nan::New("getCursor").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(GetCursor)->GetFunction());
  exports->Set(Nan::New("performClick").ToLocalChecked(),
               Nan::New<v8::FunctionTemplate>(PerformClick)->GetFunction());
}

NODE_MODULE(mouse, Init);
