import Foundation
import Vision
import AppKit

let path = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : "/tmp/reddit-form.png"
guard let img = NSImage(contentsOfFile: path),
      let cgImage = img.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    print("ERROR: cannot load image")
    exit(1)
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = false

let handler = VNImageRequestHandler(cgImage: cgImage)
try? handler.perform([request])

if let results = request.results {
    for observation in results {
        if let candidate = observation.topCandidates(1).first {
            let box = observation.boundingBox
            print(String(format: "[y:%.2f x:%.2f] %@", box.origin.y, box.origin.x, candidate.string))
        }
    }
}
