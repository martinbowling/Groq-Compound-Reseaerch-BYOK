import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ModelType } from "@shared/types/research";

interface ModelSelectorProps {
  value: ModelType;
  onChange: (value: ModelType) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  return (
    <div className="space-y-2">
      <Label className="text-gray-300">Select Model</Label>
      <RadioGroup 
        value={value} 
        onValueChange={(val) => onChange(val as ModelType)}
        className="space-y-2"
      >
        <div className="flex items-start space-x-2">
          <RadioGroupItem 
            value="combined" 
            id="model-combined" 
            className="mt-1 h-4 w-4 text-[#9C27B0] focus:ring-[#9C27B0] border-[#666666] bg-[#333333]"
          />
          <div className="space-y-1">
            <Label 
              htmlFor="model-combined" 
              className="font-medium text-white"
            >
              Combined (Recommended)
            </Label>
            <p className="text-xs text-gray-400">
              Uses both models for comprehensive research with maximum quality
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-2">
          <RadioGroupItem 
            value="compound" 
            id="model-compound" 
            className="mt-1 h-4 w-4 text-[#9C27B0] focus:ring-[#9C27B0] border-[#666666] bg-[#333333]"
          />
          <div className="space-y-1">
            <Label 
              htmlFor="model-compound" 
              className="font-medium text-white"
            >
              Groq Compound
            </Label>
            <p className="text-xs text-gray-400">
              Specialized for academic research with superior reasoning
            </p>
          </div>
        </div>
        
        <div className="flex items-start space-x-2">
          <RadioGroupItem 
            value="llama" 
            id="model-llama" 
            className="mt-1 h-4 w-4 text-[#9C27B0] focus:ring-[#9C27B0] border-[#666666] bg-[#333333]"
          />
          <div className="space-y-1">
            <Label 
              htmlFor="model-llama" 
              className="font-medium text-white"
            >
              Llama 4 Maverick
            </Label>
            <p className="text-xs text-gray-400">
              Faster generation with good knowledge but less detailed
            </p>
          </div>
        </div>
      </RadioGroup>
    </div>
  );
}
