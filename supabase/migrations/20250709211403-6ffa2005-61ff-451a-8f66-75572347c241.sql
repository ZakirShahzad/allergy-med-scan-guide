-- Create user_medications table to store current medications
CREATE TABLE public.user_medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  purpose TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.user_medications ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own medications" 
ON public.user_medications 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own medications" 
ON public.user_medications 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own medications" 
ON public.user_medications 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own medications" 
ON public.user_medications 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_user_medications_updated_at
BEFORE UPDATE ON public.user_medications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create food_analysis_history table to store analysis results
CREATE TABLE public.food_analysis_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  analysis_type TEXT NOT NULL, -- 'photo', 'search', 'upload', 'barcode'
  compatibility_score INTEGER,
  interaction_level TEXT, -- 'positive', 'neutral', 'negative'
  warnings TEXT[],
  recommendations TEXT[],
  analyzed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for analysis history
ALTER TABLE public.food_analysis_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own analysis history" 
ON public.food_analysis_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own analysis history" 
ON public.food_analysis_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);