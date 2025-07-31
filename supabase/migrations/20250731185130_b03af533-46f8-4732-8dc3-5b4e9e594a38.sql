-- Create storage bucket for crash reports
INSERT INTO storage.buckets (id, name, public) 
VALUES ('crash-reports', 'crash-reports', true);

-- Create policies for crash reports storage
CREATE POLICY "Anyone can view crash reports" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'crash-reports');

CREATE POLICY "Anyone can upload crash reports" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'crash-reports');

CREATE POLICY "Anyone can update crash reports" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'crash-reports');